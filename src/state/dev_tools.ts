export class DevToolsState {
  // Entity inspector data
  entityData: Array<{ entityId: number; componentData: Record<string, any> }> = [];
  componentNames: string[] = [];

  // Dev tools form
  varsFormEnabled = false;
}
