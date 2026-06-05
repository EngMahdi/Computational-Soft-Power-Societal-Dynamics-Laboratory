import { AgentLedger } from './AgentLedger';
import { InterventionLedger } from './InterventionLedger';
import { AnomalyLedger } from './AnomalyLedger';

class ResearchLedgerSystem {
  public agentLedger = new AgentLedger(50);
  public interventionLedger = new InterventionLedger();
  public anomalyLedger = new AnomalyLedger();

  public reset() {
    this.agentLedger = new AgentLedger(50);
    this.interventionLedger = new InterventionLedger();
    this.anomalyLedger = new AnomalyLedger();
  }
}

export const Ledger = new ResearchLedgerSystem();
