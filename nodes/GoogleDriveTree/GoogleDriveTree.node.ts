import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeListSearchResult,
} from 'n8n-workflow';

import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

interface DriveFile {
	id: string;
	name: string;
	mimeType: string;
	parents?: string[];
	starred?: boolean;
	properties?: Record<string, string>;
	appProperties?: Record<string, string>;
	permissions?: IDataObject[];
}

interface SearchResultItem extends INodePropertyOptions {
	url?: string;
}

interface TreeNode extends IDataObject {
	id: string;
	name: string;
	mimeType: string;
	children: TreeNode[];
}

export class GoogleDriveTree implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Drive Recursive',
		name: 'googleDriveTree',
		icon: 'file:googleDrive.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] === "tree" ? "Generate Folder Tree" : $parameter["operation"] === "fileList" ? "List All Folders/Files" : "Download File"}}',
		description: 'Recursively builds a folder tree from Google Drive with flexible output modes',
		defaults: {
			name: 'Google Drive Recursive',
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
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Tree (Folder/File Structure)',
						value: 'tree',
						description: 'Hierarchical tree structure with nested children',
						action: 'Get a folder and file tree structure',
					},
					{
						name: 'File List (Simple JSON Array)',
						value: 'fileList',
						description: 'Flat array of objects for files and/or folders with parent references',
						action: 'Get a flat folder and file list',
					},
					{
						name: 'Download File',
						value: 'downloadFile',
						description: 'Download a specific file from Google Drive',
						action: 'Download a file from google drive',
					},
				],
				default: 'tree',
				description: 'Choose how to format the output',
			},
			{
				displayName: 'Folder',
				name: 'folder',
				type: 'resourceLocator',
				default: { mode: 'list', value: 'root' },
				required: true,
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a folder',
						typeOptions: {
							searchListMethod: 'searchFolders',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. root or 1ABC123XYZ789',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[a-zA-Z0-9_-]+$',
									errorMessage: 'Not a valid folder ID',
								},
							},
						],
					},
				],
			},
			{
				displayName: 'File',
				name: 'fileId',
				type: 'resourceLocator',
				default: { mode: 'id', value: '' },
				required: true,
				displayOptions: {
					show: {
						operation: ['downloadFile'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a file',
						typeOptions: {
							searchListMethod: 'fileSearch',
							searchable: true,
						},
					},
					{
						displayName: 'By URL',
						name: 'url',
						type: 'string',
						placeholder: 'e.g. https://drive.google.com/file/d/1ABC123XYZ789/edit',
						extractValue: {
							type: 'regex',
							regex: '/file/d/([a-zA-Z0-9-_]+)',
						},
						validation: [
							{
								type: 'regex',
								properties: {
									regex: 'drive\\.google\\.com/file/d/[a-zA-Z0-9\\-_]+',
									errorMessage: 'Not a valid Google Drive File URL',
								},
							},
						],
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 1ABC123XYZ789',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[a-zA-Z0-9_-]+$',
									errorMessage: 'Not a valid file ID',
								},
							},
						],
					},
				],
				description: 'The file to download',
			},
			{
				displayName: 'Include Folders',
				name: 'includeFolders',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['fileList'],
					},
				},
				description: 'Whether to include folders in the file list output (only applies to File List mode)',
			},
			{
				displayName: 'Output as Separate Items',
				name: 'outputAsItems',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['fileList'],
					},
				},
				description: 'Whether to output all results as separate items, useful to use with Filter nodes for advanced workflows',
			},
			{
				displayName: 'Sort Order',
				name: 'sortOrder',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['fileList'],
					},
				},
				options: [
					{
						name: 'Created (Newest)',
						value: 'createdDesc',
						description: 'Sort by creation date, newest first',
					},
					{
						name: 'Created (Oldest)',
						value: 'createdAsc',
						description: 'Sort by creation date, oldest first',
					},
					{
						name: 'Modified (Newest)',
						value: 'modifiedDesc',
						description: 'Sort by modification date, newest first',
					},
					{
						name: 'Modified (Oldest)',
						value: 'modifiedAsc',
						description: 'Sort by modification date, oldest first',
					},
					{
						name: 'Name (A-Z)',
						value: 'nameAsc',
						description: 'Sort folders by name in ascending order',
					},
					{
						name: 'Name (Z-A)',
						value: 'nameDesc',
						description: 'Sort folders by name in descending order',
					},
				],
				default: 'nameAsc',
				description: 'How to sort the folders when building the tree',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				options: [
					{
						displayName: 'Filter by Property Value',
						name: 'filterByProperty',
						type: 'fixedCollection',
						default: { propertyFilters: [] },
						typeOptions: {
							multipleValues: true,
						},
						placeholder: 'Add property filter',
						options: [
							{
								displayName: 'Property Filters',
								name: 'propertyFilters',
								values: [
									{
										displayName: 'Property Type',
										name: 'propertyType',
										type: 'options',
										default: 'properties',
										description: 'Whether to filter by custom properties or application-specific properties',
										options: [
											{
												name: 'Custom Properties (Public)',
												value: 'properties',
												description: 'Search in public custom properties',
											},
											{
												name: 'App Properties (Private)',
												value: 'appProperties',
												description: 'Search in application-specific private properties',
											},
										],
									},
									{
										displayName: 'Property Key',
										name: 'key',
										type: 'string',
										default: '',
										placeholder: 'e.g., project, status, ID',
										description: 'The property key to filter by',
									},
									{
										displayName: 'Property Value',
										name: 'value',
										type: 'string',
										default: '',
										placeholder: 'e.g., alpha, completed, 12345',
										description: 'The value to match for the property key',
									},
								],
							},
						],
					},
					{
						displayName: 'File Types',
						name: 'fileTypes',
						type: 'multiOptions',
						default: [],
						description: 'Return only items corresponding to the selected MIME types',
						options: [
							{
								name: 'Audio',
								value: 'application/vnd.google-apps.audio',
							},
							{
								name: 'Document',
								value: 'application/vnd.google-apps.document',
							},
							{
								name: 'Drawing',
								value: 'application/vnd.google-apps.drawing',
							},
							{
								name: 'File',
								value: 'application/vnd.google-apps.file',
							},
							{
								name: 'Folder',
								value: 'application/vnd.google-apps.folder',
							},
							{
								name: 'Form',
								value: 'application/vnd.google-apps.form',
							},
							{
								name: 'Map',
								value: 'application/vnd.google-apps.map',
							},
							{
								name: 'Photo',
								value: 'application/vnd.google-apps.photo',
							},
							{
								name: 'Presentation',
								value: 'application/vnd.google-apps.presentation',
							},
							{
								name: 'Script',
								value: 'application/vnd.google-apps.script',
							},
							{
								name: 'Shortcut',
								value: 'application/vnd.google-apps.shortcut',
							},
							{
								name: 'Spreadsheet',
								value: 'application/vnd.google-apps.spreadsheet',
							},
							{
								name: 'Video',
								value: 'application/vnd.google-apps.video',
							},
						],
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Binary Field Name',
						name: 'binaryPropertyName',
						type: 'string',
						default: 'data',
						displayOptions: {
							show: {
								'/operation': ['downloadFile'],
							},
						},
						placeholder: 'e.g. data',
						description: 'The field name where the binary file data will be stored',
					},
					{
						displayName: 'Fields to Return',
						name: 'fieldsToReturn',
						type: 'multiOptions',
						default: ['id', 'name', 'mimeType'],
						description: 'Select which file metadata fields to return. If not specified, returns basic fields (ID, name, mimeType).',
						options: [
							{
								name: 'Created Time',
								value: 'createdTime',
								description: 'The creation time of the file',
							},
							{
								name: 'Description',
								value: 'description',
								description: 'The file description',
							},
							{
								name: 'File Extension',
								value: 'fileExtension',

							},
							{
								name: 'ID',
								value: 'id',
								description: 'The file ID',
							},
							{
								name: 'MD5 Checksum',
								value: 'md5Checksum',
								description: 'MD5 hash of the file contents',
							},
							{
								name: 'MIME Type',
								value: 'mimeType',
								description: 'The MIME type of the file',
							},
							{
								name: 'Modified Time',
								value: 'modifiedTime',
								description: 'The last modification time',
							},
							{
								name: 'Name',
								value: 'name',
								description: 'The file name',
							},
							{
								name: 'Owners',
								value: 'owners',
								description: 'The file owners',
							},
							{
								name: 'Parents',
								value: 'parents',
								description: 'The parent folder IDs',
							},
							{
								name: 'Permissions',
								value: 'permissions',
								description: 'The file permissions',
							},
							{
								name: 'Resource Key',
								value: 'resourceKey',
								description: 'The resource key for shared drive files',
							},
							{
								name: 'Shared Drive ID',
								value: 'driveId',
								description: 'The shared drive ID if applicable',
							},
							{
								name: 'Size',
								value: 'size',
								description: 'The file size in bytes',
							},
							{
								name: 'Spaces',
								value: 'spaces',
								description: 'The spaces the file is in (drive, appDataFolder, photos)',
							},
							{
								name: 'Starred',
								value: 'starred',
								description: 'Whether the file is starred',
							},
							{
								name: 'Thumbnail Link',
								value: 'thumbnailLink',
								description: 'The thumbnail image link',
							},
							{
								name: 'Trashed',
								value: 'trashed',
								description: 'Whether the file is in trash',
							},
							{
								name: 'Web Content Link',
								value: 'webContentLink',
								description: 'The link to download the file',
							},
							{
								name: 'Web View Link',
								value: 'webViewLink',
								description: 'The link to open the file in Google Drive',
							},
						],
					},
					{
						displayName: 'Google Workspace Conversion',
						name: 'googleWorkspaceConversion',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: false,
						},
						default: {},
						displayOptions: {
							show: {
								'/operation': ['downloadFile'],
							},
						},
						placeholder: 'Add Conversion',
						options: [
							{
								displayName: 'Conversion',
								name: 'conversion',
								values: [
									{
										displayName: 'Google Docs Format',
										name: 'docsToFormat',
										type: 'options',
										options: [
											{
												name: 'HTML',
												value: 'text/html',
											},
											{
												name: 'MS Word Document',
												value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
											},
											{
												name: 'Open Office Document',
												value: 'application/vnd.oasis.opendocument.text',
											},
											{
												name: 'PDF',
												value: 'application/pdf',
											},
											{
												name: 'Rich Text (RTF)',
												value: 'application/rtf',
											},
											{
												name: 'Text (TXT)',
												value: 'text/plain',
											},
										],
										default: 'application/pdf',
										description: 'Export format for Google Docs files',
									},
									{
										displayName: 'Google Sheets Format',
										name: 'sheetsToFormat',
										type: 'options',
										options: [
											{
												name: 'CSV',
												value: 'text/csv',
											},
											{
												name: 'MS Excel',
												value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
											},
											{
												name: 'Open Office Sheet',
												value: 'application/vnd.oasis.opendocument.spreadsheet',
											},
											{
												name: 'PDF',
												value: 'application/pdf',
											},
										],
										default: 'application/pdf',
										description: 'Export format for Google Sheets files',
									},
									{
										displayName: 'Google Slides Format',
										name: 'slidesToFormat',
										type: 'options',
										options: [
											{
												name: 'MS PowerPoint',
												value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
											},
											{
												name: 'OpenOffice Presentation',
												value: 'application/vnd.oasis.opendocument.presentation',
											},
											{
												name: 'PDF',
												value: 'application/pdf',
											},
										],
										default: 'application/pdf',
										description: 'Export format for Google Slides files',
									},
									{
										displayName: 'Google Drawings Format',
										name: 'drawingsToFormat',
										type: 'options',
										options: [
											{
												name: 'JPEG',
												value: 'image/jpeg',
											},
											{
												name: 'PDF',
												value: 'application/pdf',
											},
											{
												name: 'PNG',
												value: 'image/png',
											},
											{
												name: 'SVG',
												value: 'image/svg+xml',
											},
										],
										default: 'application/pdf',
										description: 'Export format for Google Drawings files',
									},
								],
							},
						],
					},
					{
						displayName: 'Include Permissions',
						name: 'includePermissions',
						type: 'boolean',
						default: false,
						description: 'Whether to include the file sharing permissions and access information. Note: requires sharing permissions, not available for shared drive files.',
					},
					{
						displayName: 'Properties to Return',
						name: 'propertiesToReturn',
						type: 'options',
						default: 'both',
						description: 'Which custom properties to include in the response',
						options: [
							{
								name: 'Both Public & App Properties',
								value: 'both',
								description: 'Include both custom properties and app properties',
							},
							{
								name: 'Public Properties Only',
								value: 'properties',
								description: 'Include only public custom properties',
							},
							{
								name: 'App Properties Only',
								value: 'appProperties',
								description: 'Include only application-specific properties',
							},
							{
								name: 'None',
								value: 'none',
								description: 'Do not include any custom properties',
							},
						],
					},
					{
						displayName: 'Query String',
						name: 'queryString',
						type: 'string',
						default: '',
						placeholder: "e.g. not name contains 'backup'",
						displayOptions: {
							show: {
								'/operation': ['tree', 'fileList'],
							},
						},
						description: 'Advanced Google Drive query string to further filter results. See <a href="https://developers.google.com/drive/api/v3/search-files" target="_blank">Google Drive search documentation</a> for syntax.',
					},
					{
						displayName: 'Return All Fields',
						name: 'returnAllFields',
						type: 'boolean',
						default: false,
						description: 'Whether to return all available fields for each file/folder or just the basic ones (ID, name, mimeType)',
					},
				],
			},
		],
	};

	methods = {
		listSearch: {
			async searchFolders(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const returnData: SearchResultItem[] = [];
				const maxDisplayResults = 20; // Limit displayed results to 20

				try {
					// Add "My Drive" as the first option (always include it)
					if (!filter || 'My Drive'.toLowerCase().includes(filter.toLowerCase())) {
						returnData.push({
							name: 'My Drive',
							value: 'root',
							url: 'https://drive.google.com',
						});
					}

					// Get sort order from node parameters
					const sortOrder = (this.getNode()?.parameters?.sortOrder as string) || 'nameAsc';

					// Map sort order to Google Drive API orderBy parameter
					let orderByParam = 'name';
					if (sortOrder.includes('modified')) {
						orderByParam = 'modifiedTime desc';
					} else if (sortOrder.includes('created')) {
						orderByParam = 'createdTime desc';
					} else {
						orderByParam = 'name';
					}

					const pageSize = 1000;
					let q = `mimeType='application/vnd.google-apps.folder' and trashed=false`;

					// Add filter to query if provided
					if (filter) {
						q += ` and name contains '${filter.replace(/'/g, "\\'")}'`;
					}

					const request = async (pageToken?: string) => {
						const options = {
							method: 'GET' as const,
							url: 'https://www.googleapis.com/drive/v3/files',
							qs: {
								q,
								fields: 'files(id,name,modifiedTime,createdTime,webViewLink),nextPageToken',
								pageSize,
								supportsAllDrives: 'true',
								includeItemsFromAllDrives: 'true',
								orderBy: orderByParam,
								pageToken: pageToken || undefined,
							},
							json: true,
						};

						return this.helpers.requestOAuth2.call(this, 'googleDriveOAuth2Api', options);
					};

					let pageToken: string | undefined;
					let allFolders: Array<{ id: string; name: string; modifiedTime?: string; createdTime?: string; webViewLink?: string }> = [];
					let hasMore = true;

					// Fetch folders (no limit on fetching, only on display)
					// This ensures we get all matching results to sort and display the best 20
					while (hasMore) {
						const resp = await request(pageToken);
						if (resp.files) {
							allFolders = allFolders.concat(resp.files);
						}
						pageToken = resp.nextPageToken;
						hasMore = !!pageToken;
					}

					// Sort by selected order
					allFolders.sort((a, b) => {
						switch (sortOrder) {
							case 'nameAsc':
								return a.name.localeCompare(b.name);
							case 'nameDesc':
								return b.name.localeCompare(a.name);
							case 'modifiedDesc':
								return new Date(b.modifiedTime || 0).getTime() - new Date(a.modifiedTime || 0).getTime();
							case 'modifiedAsc':
								return new Date(a.modifiedTime || 0).getTime() - new Date(b.modifiedTime || 0).getTime();
							case 'createdDesc':
								return new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime();
							case 'createdAsc':
								return new Date(a.createdTime || 0).getTime() - new Date(b.createdTime || 0).getTime();
							default:
								return a.name.localeCompare(b.name);
						}
					});

					// Limit display results and add to return data
					const displayLimit = returnData.length > 0 ? maxDisplayResults - 1 : maxDisplayResults; // Account for "My Drive" if added
					for (const folder of allFolders.slice(0, displayLimit)) {
						returnData.push({
							name: folder.name,
							value: folder.id,
							url: folder.webViewLink,
						});
					}

					return {
						results: returnData as unknown as INodePropertyOptions[],
					};
				} catch (error) {
					return {
						results: [
							{
								name: 'My Drive',
								value: 'root',
								url: 'https://drive.google.com',
							},
						] as unknown as INodePropertyOptions[],
					};
				}
			},

			async fileSearch(
				this: ILoadOptionsFunctions,
				filter?: string,
				paginationToken?: string,
			): Promise<INodeListSearchResult> {
				const returnData: SearchResultItem[] = [];
				const maxDisplayResults = 20;

				try {
					// Get the selected folder to filter files within it
					const folderResource = this.getNode()?.parameters?.folder as {
						mode: string;
						value: string;
					} | undefined;
					const folderId = folderResource?.value || 'root';

					const pageSize = 1000;
					let q = `trashed=false and mimeType!='application/vnd.google-apps.folder'`;

					// Filter files to the selected folder
					q += ` and '${folderId}' in parents`;

					// Add filter to query if provided
					if (filter) {
						q += ` and name contains '${filter.replace(/'/g, "\\'")}'`;
					}

					const request = async (pageToken?: string) => {
						const options = {
							method: 'GET' as const,
							url: 'https://www.googleapis.com/drive/v3/files',
							qs: {
								q,
								fields: 'files(id,name,mimeType,webViewLink),nextPageToken',
								pageSize,
								supportsAllDrives: 'true',
								includeItemsFromAllDrives: 'true',
								orderBy: 'name',
								pageToken: pageToken || undefined,
							},
							json: true,
						};

						return this.helpers.requestOAuth2.call(this, 'googleDriveOAuth2Api', options);
					};

					let pageToken: string | undefined;
					let allFiles: Array<{ id: string; name: string; mimeType?: string; webViewLink?: string }> = [];
					let hasMore = true;

					// Fetch files
					while (hasMore) {
						const resp = await request(pageToken);
						if (resp.files) {
							allFiles = allFiles.concat(resp.files);
						}
						pageToken = resp.nextPageToken;
						hasMore = !!pageToken;
					}

					// Sort by name
					allFiles.sort((a, b) => a.name.localeCompare(b.name));

					// Limit display results and add to return data
					for (const file of allFiles.slice(0, maxDisplayResults)) {
						returnData.push({
							name: file.name,
							value: file.id,
							url: file.webViewLink,
						});
					}

					return {
						results: returnData as unknown as INodePropertyOptions[],
					};
				} catch (error) {
					return {
						results: [] as unknown as INodePropertyOptions[],
					};
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		// Handle Download File operation separately
		if (operation === 'downloadFile') {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					const item = items[itemIndex];
					
					// Get file ID from resourceLocator parameter
					const fileResource = this.getNodeParameter('fileId', itemIndex) as {
						mode: string;
						value: string;
					};
					const fileId = fileResource?.value || '';

					if (!fileId) {
						throw new NodeOperationError(this.getNode(), 'File ID is required');
					}

					// Get options
					const options = this.getNodeParameter('options', itemIndex, {}) as Record<string, any>;
					const binaryPropertyName = (options.binaryPropertyName as string) || 'data';
					const googleWorkspaceConversion = options.googleWorkspaceConversion as any;
					const propertiesToReturn = (options.propertiesToReturn as string) || 'both';
					const fieldsToReturn = (options.fieldsToReturn as string[]) || ['id', 'name', 'mimeType'];
					const returnAllFields = (options.returnAllFields as boolean) || false;

					// Build fields parameter based on user selection
					let fieldsParam: string;
					
					if (returnAllFields) {
						// Request all available fields
						fieldsParam = '*';
					} else {
						// Always ensure mimeType and name are included for download logic
						const fieldsSet = new Set(fieldsToReturn);
						fieldsSet.add('mimeType');
						fieldsSet.add('name');
						fieldsParam = Array.from(fieldsSet).join(',');
						
						// Add properties fields if requested
						if (propertiesToReturn === 'both') {
							fieldsParam += ',properties,appProperties';
						} else if (propertiesToReturn === 'properties') {
							fieldsParam += ',properties';
						} else if (propertiesToReturn === 'appProperties') {
							fieldsParam += ',appProperties';
						}
						
						// Always add permissions if Include Permissions is checked
						if (options.includePermissions === true) {
							fieldsParam += ',permissions';
						}
					}

					// Get file metadata to determine MIME type and handle conversions
					const fileMetadata = await this.helpers.requestOAuth2.call(this, 'googleDriveOAuth2Api', {
						method: 'GET',
						url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
						qs: {
							fields: fieldsParam,
							supportsAllDrives: true,
						},
						json: true,
					});

					let downloadUrl: string;
					let mimeType = fileMetadata.mimeType;

					// Handle Google Workspace file format conversion
					if (fileMetadata.mimeType?.includes('vnd.google-apps')) {
						const type = fileMetadata.mimeType.split('.')[2];
						let exportMimeType: string;

						if (type === 'document' && googleWorkspaceConversion?.conversion?.docsToFormat) {
							exportMimeType = googleWorkspaceConversion.conversion.docsToFormat;
						} else if (type === 'spreadsheet' && googleWorkspaceConversion?.conversion?.sheetsToFormat) {
							exportMimeType = googleWorkspaceConversion.conversion.sheetsToFormat;
						} else if (type === 'presentation' && googleWorkspaceConversion?.conversion?.slidesToFormat) {
							exportMimeType = googleWorkspaceConversion.conversion.slidesToFormat;
						} else if (type === 'drawing' && googleWorkspaceConversion?.conversion?.drawingsToFormat) {
							exportMimeType = googleWorkspaceConversion.conversion.drawingsToFormat;
						} else {
							// Use defaults
							if (type === 'document') exportMimeType = 'application/pdf';
							else if (type === 'spreadsheet') exportMimeType = 'application/pdf';
							else if (type === 'presentation') exportMimeType = 'application/pdf';
							else exportMimeType = 'application/pdf';
						}

						downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export`;
						mimeType = exportMimeType;
					} else {
						downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
					}

					// Download the file
					const fileData = await this.helpers.requestOAuth2.call(this, 'googleDriveOAuth2Api', {
						method: 'GET',
						url: downloadUrl,
						qs: fileMetadata.mimeType?.includes('vnd.google-apps')
							? { mimeType: mimeType, supportsAllDrives: true }
							: { alt: 'media', supportsAllDrives: true },
						encoding: 'arraybuffer',
					});

					// Prepare binary data
					const newItem: INodeExecutionData = {
						json: fileMetadata,
						binary: {},
					};

					if (item.binary !== undefined) {
						Object.assign(newItem.binary as any, item.binary);
					}

					const fileName = fileMetadata.name || 'file';
					newItem.binary![binaryPropertyName] = await this.helpers.prepareBinaryData(
						fileData,
						fileName,
						mimeType,
					);

					returnItems.push(newItem);
				} catch (error) {
					if (this.continueOnFail()) {
						returnItems.push({
							json: {
								error: (error as Error).message,
							},
						});
						continue;
					}
					throw new NodeOperationError(
						this.getNode(),
						(error as Error).message || 'Failed to download file',
					);
				}
			}
			return [returnItems];
		}

		// Handle Tree and FileList operations
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			// Get folder ID from resourceLocator parameter
			const folderResource = this.getNodeParameter('folder', itemIndex) as {
				mode: string;
				value: string;
			};
			const folderId = folderResource?.value || 'root';
			
			const outputMode = this.getNodeParameter('operation', itemIndex) as string;
			const includeFolders = this.getNodeParameter('includeFolders', itemIndex, false) as boolean;
			const outputAsItems = this.getNodeParameter('outputAsItems', itemIndex, false) as boolean;
			
			// Get filters
			const filters = this.getNodeParameter('filters', itemIndex, {}) as Record<string, any>;
			const fileTypes = (filters.fileTypes as string[]) || [];
			const propertyFiltersData = (filters.filterByProperty as any) || {};
			
			// Get options
			const options = this.getNodeParameter('options', itemIndex, {}) as Record<string, any>;
			const queryString = (options.queryString as string) || '';
			const propertiesToReturn = (options.propertiesToReturn as string) || 'both';
			const includePermissions = (options.includePermissions as boolean) || false;
			const fieldsToReturn = (options.fieldsToReturn as string[]) || ['id', 'name', 'mimeType'];

			// Build fields parameter based on user selection and propertiesToReturn
			// Always include 'parents' as it's required for tree structure and file list output
			let fieldsParam = fieldsToReturn.join(',');
			if (!fieldsToReturn.includes('parents')) {
				fieldsParam += ',parents';
			}
			if (propertiesToReturn === 'both') {
				fieldsParam += ',properties,appProperties';
			} else if (propertiesToReturn === 'properties') {
				fieldsParam += ',properties';
			} else if (propertiesToReturn === 'appProperties') {
				fieldsParam += ',appProperties';
			}
			if (includePermissions) {
				fieldsParam += ',permissions';
			}
			// Note: nextPageToken is added at the root level, not within files()

			// Always include shared drives, fixed page size.
			const includeAllDrives = true;
			const pageSize = 1000;

			const request = async (opts: {
				qs: Record<string, string | number | boolean | undefined>;
			}) => {
				const options = {
					method: 'GET' as const,
					url: 'https://www.googleapis.com/drive/v3/files',
					qs: {
						fields: `files(${fieldsParam}),nextPageToken`,
						pageSize,
						...opts.qs,
					},
					json: true,
				};

				return this.helpers.requestOAuth2.call(this, 'googleDriveOAuth2Api', options);
			};

			const queue: string[] = [folderId || 'root'];
			const seenFolders: Record<string, boolean> = { [queue[0]]: true };
			const filesFlat: DriveFile[] = [];

			const isFolder = (mimeType: string) => mimeType === 'application/vnd.google-apps.folder';
			
			// Build query filters for final filtering (post-processing)
			// Note: These filters will be applied AFTER collecting all files via recursion
			const userFiltersConfig = {
				fileTypes,
				propertyFiltersData,
				queryString,
			};

			while (queue.length > 0) {
				const current = queue.shift() as string;
				let pageToken: string | undefined;

				do {
					// Build query for RECURSION ONLY - get ALL items and folders
					// We need all folders to continue recursion, regardless of user filters
					const recursionQueryParts = [
						`"${current}" in parents`,
						'trashed=false', // Always exclude trash during recursion to avoid broken references
					];

					const qs: Record<string, any> = {
						q: recursionQueryParts.join(' and '),
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
							if (isFolder(f.mimeType) && !seenFolders[f.id]) {
								seenFolders[f.id] = true;
								queue.push(f.id);
							}
						}
					}

					pageToken = resp.nextPageToken;
				} while (pageToken);
			}

			// Apply user filters to the collected files (post-processing)
			let filteredFiles = filesFlat;

			// Filter by file type
			if (userFiltersConfig.fileTypes.length > 0) {
				filteredFiles = filteredFiles.filter((f) => 
					userFiltersConfig.fileTypes.includes(f.mimeType)
				);
			}

			// Filter by properties
			const propFiltersData = (userFiltersConfig.propertyFiltersData as any) || {};
			const propFiltersArray = (propFiltersData.propertyFilters as any[]) || [];
			if (propFiltersArray.length > 0) {
				filteredFiles = filteredFiles.filter((f) => {
					return propFiltersArray.every((filter) => {
						if (!filter.key || !filter.value) return true;
						const propType = filter.propertyType || 'properties';
						const props = propType === 'appProperties' ? f.appProperties : f.properties;
						if (!props) return false;
						return props[filter.key] === filter.value;
					});
				});
			}

			// Filter by custom query string (requires manual matching)
			// Note: Complex query strings may not be fully evaluable post-fetch
			// This is a limitation - complex queries should ideally be applied during recursion
			if (userFiltersConfig.queryString) {
				// For now, we skip applying complex query strings in post-processing
				// Users should be aware that complex queries work better during the API call
				// TODO: Implement query parser for common patterns if needed
			}

			// Build output based on selected output mode
			let outputData: IDataObject | IDataObject[];

			// Apply includeFolders filter to the already-filtered results
			const finalResults = includeFolders 
				? filteredFiles 
				: filteredFiles.filter((f) => !isFolder(f.mimeType));

			if (outputMode === 'fileList') {
				// Output as flat file list
				outputData = finalResults.map((f) => {
					const fileObj: IDataObject = {
						id: f.id,
						name: f.name,
						mimeType: f.mimeType,
						parents: f.parents || [],
					};

					// Include properties if they were requested
					if (propertiesToReturn === 'both' || propertiesToReturn === 'properties') {
						if (f.properties) {
							fileObj.properties = f.properties;
						}
					}

					// Include appProperties if they were requested
					if (propertiesToReturn === 'both' || propertiesToReturn === 'appProperties') {
						if (f.appProperties) {
							fileObj.appProperties = f.appProperties;
						}
					}

					// Include permissions if they were requested
					if (includePermissions) {
						if (f.permissions) {
							fileObj.permissions = f.permissions;
						}
					}

					return fileObj;
				});
			} else {
				// Output as tree structure (default)
				// Build tree structure from final filtered results
				const byId: Record<string, TreeNode> = {};
				for (const f of finalResults) {
					const nodeData: IDataObject = {
						id: f.id,
						name: f.name,
						mimeType: f.mimeType,
						children: [],
					};

					// Include properties if they were requested
					if (propertiesToReturn === 'both' || propertiesToReturn === 'properties') {
						if (f.properties) {
							nodeData.properties = f.properties;
						}
					}

					// Include appProperties if they were requested
					if (propertiesToReturn === 'both' || propertiesToReturn === 'appProperties') {
						if (f.appProperties) {
							nodeData.appProperties = f.appProperties;
						}
					}

					// Include permissions if they were requested
					if (includePermissions) {
						if (f.permissions) {
							nodeData.permissions = f.permissions;
						}
					}

					byId[f.id] = nodeData as TreeNode;
				}

				const virtualRoot: TreeNode = {
					id: folderId,
					name: '(root)',
					mimeType: 'application/vnd.google-apps.folder',
					children: [],
				};

				for (const f of finalResults) {
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

				const rootNode = byId[folderId] ?? virtualRoot;
				outputData = rootNode;
			}

			// Handle output formatting
			if (outputAsItems && outputMode === 'fileList') {
				// Output each item as a separate return item (better for downstream n8n workflows)
				const itemsArray = outputData as IDataObject[];
				for (const item of itemsArray) {
					returnItems.push({ json: item });
				}
			} else {
				// Output as a single array (original behavior)
				returnItems.push({ json: outputData as any });
			}
		}

		return [returnItems];
	}
}
