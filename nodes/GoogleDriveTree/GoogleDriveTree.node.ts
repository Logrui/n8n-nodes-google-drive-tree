import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import { NodeConnectionType } from 'n8n-workflow';

interface DriveFile {
	id: string;
	name: string;
	mimeType: string;
	parents?: string[];
}

interface TreeNode extends IDataObject {
	id: string;
	name: string;
	mimeType: string;
	children: TreeNode[];
}

export class GoogleDriveTree implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Drive Tree',
		name: 'googleDriveTree',
		icon: 'file:googleDrive.svg',
		group: ['transform'],
		version: 1,
		description: 'Recursively builds a folder tree from Google Drive',
		defaults: {
			name: 'Google Drive Tree',
		},
		credentials: [
			{
				name: 'googleDriveOAuth2Api',
				required: true,
			},
		],
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Root Folder ID',
				name: 'rootFolderId',
				type: 'string',
				default: 'root',
				placeholder: 'root or a specific folder ID',
				required: true,
				description: 'Start folder. Use "root" for My Drive, or provide a specific folder ID.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnItems: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const rootFolderId = this.getNodeParameter('rootFolderId', itemIndex) as string;

			// Always include shared drives and include all Google Docs types, fixed page size.
			// For future release, these could be made configurable.
			const includeAllDrives = true;
			const pageSize = 1000;

			const request = async (opts: {
				qs: Record<string, string | number | boolean | undefined>;
			}) => {
				const options = {
					method: 'GET' as const,
					url: 'https://www.googleapis.com/drive/v3/files',
					qs: {
						fields: 'files(id,name,mimeType,parents),nextPageToken',
						pageSize,
						...opts.qs,
					},
					json: true,
				};

				return this.helpers.requestOAuth2.call(this, 'googleDriveOAuth2Api', options);
			};

			const queue: string[] = [rootFolderId || 'root'];
			const seenFolders: Record<string, boolean> = { [queue[0]]: true };
			const filesFlat: DriveFile[] = [];

			const isFolder = (f: DriveFile) => f.mimeType === 'application/vnd.google-apps.folder';

			while (queue.length > 0) {
				const current = queue.shift() as string;
				let pageToken: string | undefined;

				do {
					const qs: Record<string, any> = {
						q: `"${current}" in parents and trashed=false`,
						pageToken,
						// Shared Drives flags
						supportsAllDrives: includeAllDrives ? 'true' : 'false',
						includeItemsFromAllDrives: includeAllDrives ? 'true' : 'false',
					};

					const resp = await request({ qs });
					const batch: DriveFile[] = (resp.files || []) as DriveFile[];

					for (const f of batch) filesFlat.push(f);

					if (!resp.nextPageToken) {
						for (const f of batch) {
							if (isFolder(f) && !seenFolders[f.id]) {
								seenFolders[f.id] = true;
								queue.push(f.id);
							}
						}
					}

					pageToken = resp.nextPageToken;
				} while (pageToken);
			}

			// Build tree structure
			const byId: Record<string, TreeNode> = {};
			for (const f of filesFlat) {
				byId[f.id] = {
					id: f.id,
					name: f.name,
					mimeType: f.mimeType,
					children: [],
				};
			}

			const virtualRoot: TreeNode = {
				id: rootFolderId,
				name: '(root)',
				mimeType: 'application/vnd.google-apps.folder',
				children: [],
			};

			for (const f of filesFlat) {
				const node = byId[f.id];
				const parents = f.parents || [];
				if (parents.length > 0) {
					const p = parents[0];
					const parentNode = byId[p];
					if (parentNode) parentNode.children.push(node);
					else virtualRoot.children.push(node);
				} else {
					virtualRoot.children.push(node);
				}
			}

			const rootNode = byId[rootFolderId] ?? virtualRoot;

			returnItems.push({ json: rootNode });
		}

		return [returnItems];
	}
}
