export class NewApplicationCreatedEvent {
  readonly applicationId: number;

  constructor(args: { applicationId: number }) {
    this.applicationId = args.applicationId;
  }
}
