// Central hook for messaging pipeline monitoring events; currently a
// no-op placeholder pending a real metrics backend.
import { Injectable } from '@nestjs/common';

type MessagingMonitoringTrackInput = {
  eventName: string;
  workspaceId?: string;
  userId?: string;
  connectedAccountId?: string;
  messageChannelId?: string;
  message?: string;
};

@Injectable()
export class MessagingMonitoringService {
  constructor() {}

  // No-op until a monitoring backend (Prometheus) is wired up.
  public async track({
    eventName: _eventName,
    workspaceId: _workspaceId,
    userId: _userId,
    connectedAccountId: _connectedAccountId,
    messageChannelId: _messageChannelId,
    message: _message,
  }: MessagingMonitoringTrackInput): Promise<void> {
    // TODO: emit monitoring once Prometheus lands
  }
}
