export interface EntityInspectorData {
  entityId: number;
  componentData: Record<string, any>;
}

export class DevToolsState {
  // Entity inspector data - Map keyed by entityId for efficient lookups and updates
  entityData: Map<number, EntityInspectorData> = new Map();
  componentNames: string[] = [];

  // Dev tools form
  varsFormEnabled = false;
}
