public class PriceRevisionQueueable implements Queueable, Database.AllowsCallouts {
    List<WorkOrder> recs;
    public PriceRevisionQueueable(List<WorkOrder> r){ recs = r; }
    public void execute(QueueableContext ctx){ HttpRequest req = new HttpRequest(); req.setEndpoint('callout:SAP_Pricing/revise'); }
}
