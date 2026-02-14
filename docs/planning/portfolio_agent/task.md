# Portfolio Trading Agent System — Task Checklist

## Planning
- [x] Research existing codebase (agents, graph, CLI, skills, config, docs)
- [x] Research Zerodha Kite Connect API
- [x] Write detailed implementation plan with reasoning
- [x] Document design decisions and Q&A
- [ ] Get user approval on plan

## Stage A: Build Now (CLI-driven, no hosting)

### Phase 1: Kite Client (Broker Layer)
- [ ] Install `kiteconnect` package
- [ ] Create `tools/kite_client.py` — KiteClient class
- [ ] Implement OAuth login flow with Flask callback
- [ ] Implement `get_holdings()` with ticker mapping
- [ ] Add token caching (`.kite_session.json`)
- [ ] Update `utils/config.py` with Kite config
- [ ] Update `.env.example`
- [ ] Add `python chat.py kite login` CLI command

### Phase 2: Portfolio Agent + CLI
- [ ] Create `agents/portfolio_agent.py`
- [ ] Create `tools/portfolio_tools.py`
- [ ] Add `portfolio_snapshots` table to `memory.py`
- [ ] Add `python chat.py portfolio` CLI command
- [ ] Add `python chat.py portfolio analyze` CLI command
- [ ] Create `context_engineering/skills/portfolio_monitoring/SKILL.md`

### Phase 3: Earnings Calendar & Scheduler
- [ ] Create `tools/scheduler.py`
- [ ] Add `earnings_calendar` table to `memory.py`
- [ ] Implement earnings date fetching from yfinance
- [ ] Implement pre-earnings and post-earnings triggers
- [ ] Implement staleness check (>90 days)

### Phase 4: News Sentinel
- [ ] Create `agents/news_sentinel.py`
- [ ] Implement news polling loop (reuse `search_google_news`)
- [ ] Implement LLM severity classification
- [ ] Implement deduplication (seen headlines in SQLite)
- [ ] Add `python chat.py news check` CLI command

### Phase 5: Thesis Drift + Alerts
- [ ] Create `tools/alert_manager.py`
- [ ] Implement WhatsApp Bot integration
- [ ] Add `alerts` table to `memory.py`
- [ ] Implement report comparison (thesis drift detection)
- [ ] Add `thesis_comparison_node` to `graph.py`
- [ ] Add `python chat.py alerts` CLI command
- [ ] Add `python chat.py alerts ack <id>` CLI command

### Phase 6: Skill File Updates
- [ ] Update `equity_trigger_analysis/SKILL.md` with portfolio context
- [ ] Create `portfolio_monitoring/SKILL.md`

## Stage B: Later (when ready for 24/7)

### Phase 7: Daemon + Hosting
- [ ] Create `daemon.py`
- [ ] Set up VPS deployment
- [ ] Configure APScheduler for background jobs
- [ ] Add heartbeat monitoring

## Verification
- [ ] Test Kite API connection and portfolio fetch
- [ ] Test automated report generation for portfolio
- [ ] Test earnings calendar scheduler
- [ ] Test news monitoring pipeline
- [ ] Test sell alert + human-in-the-loop flow
