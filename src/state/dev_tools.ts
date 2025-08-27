export class DevToolsState {
  // Entity inspector data
  entityData: Array<{ entityId: number; components: Record<string, any> }> = [];
  componentNames: string[] = [];
  reactDirty = false;
  
  // Dev tools form
  varsFormEnabled = false;
}