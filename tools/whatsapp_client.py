import subprocess
import json
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path

# Configure logging
logger = logging.getLogger("whatsapp_client")

class WhatsAppClient:
    """
    A client for interacting with WhatsApp via the 'mudslide' CLI tool.
    Requires 'mudslide' to be installed (npm install -g mudslide).
    """

    def __init__(self, cli_path: str = None):
        """
        Initialize the WhatsApp client.
        
        Args:
            cli_path: Path to the npx executable or mudslide binary. Defaults to:
                      1. "npx" (if in PATH)
                      2. Common install locations if not in PATH.
        """
        self.cli_path = cli_path or self._find_npx()
        self.base_cmd = [self.cli_path, "-y", "mudslide"]

    def _find_npx(self) -> str:
        """Find the npx executable."""
        import shutil
        import os
        
        # Priority 1: Explicit check for standard Windows location
        # This is the most reliable if PATH hasn't updated
        std_path = r"C:\Program Files\nodejs\npx.cmd"
        if os.path.exists(std_path):
            return std_path

        # Priority 2: Check PATH
        path_exe = shutil.which("npx")
        if path_exe:
             return "npx"
            
        # Priority 3: Other common locations
        common_paths = [
            r"C:\Program Files (x86)\nodejs\npx.cmd",
            os.path.expandvars(r"%APPDATA%\npm\npx.cmd"),
        ]
        
        for path in common_paths:
            if os.path.exists(path):
                return path
                
        return "npx"

    def _run_command(self, args: List[str], capture_output: bool = True) -> subprocess.CompletedProcess:
        """Helper to run mudslide commands."""
        command = self.base_cmd + args
        try:
            logger.debug(f"Running command: {' '.join(command)}")
            result = subprocess.run(
                command,
                capture_output=capture_output,
                text=True,
                check=True,
                encoding='utf-8',
                errors='replace' # Handle any still-weird chars gracefully
            )
            return result
        except subprocess.CalledProcessError as e:
            logger.error(f"Mudslide command failed: {e.stderr}")
            raise RuntimeError(f"WhatsApp command failed: {e.stderr}") from e
        except FileNotFoundError:
             logger.error("npx or mudslide not found. Please install Node.js and mudslide.")
             raise RuntimeError("npx not found. Please ensure Node.js is installed.")

    def login(self):
        """
        Initiates the login process.
        displays the QR code in the terminal.
        """
        print("Please scan the QR code below with your WhatsApp app (Linked Devices):")
        # We don't capture output here so the QR code is printed directly to stdout
        try:
           self._run_command(["login"], capture_output=False)
           print("\nLogin successful!")
        except Exception as e:
            print(f"Login failed: {e}")

    def send_message(self, to: str, message: str) -> bool:
        """
        Sends a text message to a phone number.

        Args:
            to: Phone number in international format (e.g., '919876543210').
            message: The text message to send.

        Returns:
            True if successful, False otherwise.
        """
        try:
            self._run_command(["send", to, message])
            return True
        except Exception as e:
            logger.error(f"Failed to send message to {to}: {e}")
            return False
            
    def get_me(self) -> Optional[Dict[str, Any]]:
        """Returns information about the current user."""
        try:
            result = self._run_command(["me"])
            # Mudslide 'me' command output might need parsing if it's not pure JSON
            # We'll return the raw output for now
            return {"raw_output": result.stdout.strip()}
        except Exception:
            return None

    def listen_for_messages(self, provide_input_channel=None):
        """
        Generator that listens for incoming messages using 'tools/whatsapp_listener.js'.
        Yields dictionaries containing message details.
        
        Args:
            provide_input_channel: A callback function that will receive a send(jid, text) function.
        """
        current_dir = Path(__file__).parent.absolute()
        listener_script = current_dir / "whatsapp_listener.js"
        
        node_cmd = "node"
        if self.cli_path and self.cli_path.endswith("npx.cmd"):
             possible_node = str(Path(self.cli_path).parent / "node.exe")
             import os
             if os.path.exists(possible_node):
                 node_cmd = possible_node

        command = [node_cmd, str(listener_script)]
        logger.debug(f"Starting monitor: {' '.join(command)}")
        
        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            encoding='utf-8',
            errors='replace'
        )

        # Define the sender function that writes to listener's stdin
        def send_through_listener(jid, text):
            if process.poll() is None: # Still running
                # Use JSON to safely pass multiline text over stdin
                data = json.dumps({"jid": jid, "text": text})
                process.stdin.write(f"JSON_SEND:{data}\n")
                process.stdin.flush()
                return True
            return False

        # Provide the input channel if callback provided
        if provide_input_channel:
            provide_input_channel(send_through_listener)

        try:
            # Start a thread to read stderr and print it to the console (for debugging)
            from rich.console import Console
            debug_console = Console(stderr=True)
            
            def stream_stderr():
                try:
                    for line in iter(process.stderr.readline, ''):
                        if line:
                            debug_console.print(f"[dim cyan][Listener] {line.strip()}[/dim cyan]")
                except Exception:
                    pass
            
            import threading
            stderr_thread = threading.Thread(target=stream_stderr, daemon=True)
            stderr_thread.start()

            while True:
                line = process.stdout.readline()
                if not line:
                    if process.poll() is not None:
                        break
                    continue
                
                line = line.strip()       
                if not line:
                    continue
                
                # Check for our new JSON message format
                if line.startswith("JSON_MSG:"):
                    try:
                        data = json.loads(line.split("JSON_MSG:", 1)[1])
                        yield data
                    except Exception as e:
                        logger.error(f"Failed to parse listener JSON: {e}")
                        yield {"type": "unknown", "raw": line}
                elif "Message from" in line:
                    # Backward compatibility for old format
                    parts = line.split("Message from", 1)
                    if len(parts) > 1:
                        rest = parts[1].strip()
                        if ":" in rest:
                            sender, content = rest.split(":", 1)
                            yield {
                                "type": "message",
                                "sender": sender.strip(),
                                "content": content.strip(),
                                "raw": line
                            }
                else:
                    logger.debug(f"Listener output: {line}")
                    # yield {"type": "other", "raw": line} # minimal yield to avoid processing noise

            # If we exit the loop, check return code
            return_code = process.poll()
            if return_code is not None and return_code != 0:
                stderr_output = process.stderr.read()
                logger.error(f"Listener process exited with error {return_code}: {stderr_output}")
                raise RuntimeError(f"WhatsApp listener exited unexpectedly: {stderr_output}")

        except Exception as e:
            logger.error(f"Error in monitor loop: {e}")
            process.terminate()
            raise
        finally:
            if process:
                process.terminate()

if __name__ == "__main__":
    # Simple test
    client = WhatsAppClient()
    # client.login() # Uncomment to login
    # client.send_message("1234567890", "Hello from Python!")
