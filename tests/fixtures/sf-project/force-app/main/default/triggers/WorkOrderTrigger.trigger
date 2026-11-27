trigger WorkOrderTrigger on WorkOrder (before insert, after update) {
    WorkOrderTriggerHandler.run(Trigger.new, Trigger.oldMap, Trigger.operationType);
}
