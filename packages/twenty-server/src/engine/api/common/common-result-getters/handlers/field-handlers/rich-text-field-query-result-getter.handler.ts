import {
  FieldMetadataType,
  FileFolder,
  type ObjectRecord,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type QueryResultGetterHandlerInterface } from 'src/engine/api/graphql/workspace-query-runner/factories/query-result-getters/interfaces/query-result-getter-handler.interface';

import { type FileUrlService } from 'src/engine/core-modules/file/file-url/file-url.service';
import { extractFileIdFromUrl } from 'src/engine/core-modules/file/files-field/utils/extract-file-id-from-url.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';

// oxlint-disable-next-line typescript/no-explicit-any
type RichTextBlock = Record<string, any>;

// Parses a blocknote JSON string into its block array, returning null
// (instead of throwing) on malformed or non-array content.
const parseBlocknoteJsonSafely = (
  blocknoteJson: string,
): RichTextBlock[] | null => {
  try {
    const parsed = JSON.parse(blocknoteJson);

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

// Query-result getter that re-signs image URLs embedded in a RICH_TEXT
// field's blocknote content before returning the record to the caller.
export class RichTextFieldQueryResultGetterHandler implements QueryResultGetterHandlerInterface {
  constructor(private readonly fileUrlService: FileUrlService) {}

  // Parses each RICH_TEXT field's blocknote JSON and re-signs any embedded
  // image URLs, leaving other fields untouched.
  async handle(
    record: ObjectRecord,
    workspaceId: string,
    flatFieldMetadata: FlatFieldMetadata[],
  ): Promise<ObjectRecord> {
    const richTextFields = flatFieldMetadata.filter(
      (field) => field.type === FieldMetadataType.RICH_TEXT,
    );

    if (richTextFields.length === 0) {
      return record;
    }

    for (const field of richTextFields) {
      const fieldValue = record[field.name];
      const blocknoteJson = fieldValue?.blocknote;

      if (!blocknoteJson || typeof blocknoteJson !== 'string') {
        continue;
      }

      const blocknoteBlocks = parseBlocknoteJsonSafely(blocknoteJson);

      if (!isDefined(blocknoteBlocks)) {
        continue;
      }

      const signedBlocks = await this.signBlocknoteImageUrls(
        blocknoteBlocks,
        workspaceId,
      );

      record[field.name] = {
        ...fieldValue,
        blocknote: JSON.stringify(signedBlocks),
      };
    }

    return record;
  }

  // Walks a blocknote block tree, re-signing the URL of any block whose
  // props.url points at a workspace-stored file, leaving other blocks as-is.
  signBlocknoteImageUrls = async (
    blocknoteBlocks: RichTextBlock[],
    workspaceId: string,
  ): Promise<RichTextBlock[]> => {
    return Promise.all(
      blocknoteBlocks.map(async (block: RichTextBlock) => {
        if (!isDefined(block.props?.url)) {
          return block;
        }

        const fileIdFromUrl = extractFileIdFromUrl(
          block.props.url,
          FileFolder.FilesField,
        );

        if (!isDefined(fileIdFromUrl)) {
          return block;
        }

        const url = await this.fileUrlService.signFileByIdUrl({
          fileId: fileIdFromUrl,
          workspaceId,
          fileFolder: FileFolder.FilesField,
        });

        return {
          ...block,
          props: {
            ...block.props,
            url,
          },
        };
      }),
    );
  };
}
