import { Module } from '@nestjs/common';

import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { FileAiChatResolver } from 'src/engine/core-modules/file/file-ai-chat/resolvers/file-ai-chat.resolver';
import { FileAiChatService } from 'src/engine/core-modules/file/file-ai-chat/services/file-ai-chat.service';
import { FileUrlModule } from 'src/engine/core-modules/file/file-url/file-url.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';

// Wires up file uploads used by AI chat (agent) attachments.
@Module({
  imports: [FileUrlModule, ApplicationModule, PermissionsModule],
  providers: [FileAiChatService, FileAiChatResolver],
  exports: [FileAiChatService],
})
export class FileAiChatModule {}
