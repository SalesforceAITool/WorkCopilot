public with sharing class WorkOrderTriggerHandler {
    // Bulkified: one SOQL for all service territories, avoids governor limits
    public static void run(List<WorkOrder> recs, Map<Id,WorkOrder> oldMap, System.TriggerOperation op) {
        if (op == System.TriggerOperation.AFTER_UPDATE) {
            System.enqueueJob(new PriceRevisionQueueable(recs)); // queueable because callout to SAP pricing
        }
    }
}
