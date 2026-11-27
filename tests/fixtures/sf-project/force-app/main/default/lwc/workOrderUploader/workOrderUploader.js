import { LightningElement, api } from 'lwc';
export default class WorkOrderUploader extends LightningElement {
  @api recordId;
  handleUploadFinished(event) { /* attach files to Work Order for FSL mobile technicians */ }
}
