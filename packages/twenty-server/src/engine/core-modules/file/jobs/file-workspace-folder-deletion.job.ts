// Queue processor deleting a workspace's entire file storage folder (e.g. on workspace deletion).
import { FileService } from 'src/engine/core-modules/file/services/file.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

export type FileWorkspaceFolderDeletionJobData = {
  workspaceId: string;
};

@Processor(MessageQueue.deleteCascadeQueue)
export class FileWorkspaceFolderDeletionJob {
  constructor(private readonly fileService: FileService) {}

  @Process(FileWorkspaceFolderDeletionJob.name)
  // Deletes the workspace's file storage folder, throwing a descriptive error on failure.
  async handle(data: FileWorkspaceFolderDeletionJobData): Promise<void> {
    const { workspaceId } = data;

    try {
      await this.fileService.deleteWorkspaceFolder(workspaceId);
    } catch (error) {
      throw new Error(
        `[${FileWorkspaceFolderDeletionJob.name}] Cannot delete workspace folder - ${workspaceId} - ${error?.message || error}`,
      );
    }
  }
}
