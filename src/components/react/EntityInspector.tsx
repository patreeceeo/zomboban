import React from 'react';

interface EntityInspectorProps {
  inspectorData: Array<{entityId: number; components: Record<string, any>}>;
  componentNames: string[];
}

export function EntityInspector({ inspectorData, componentNames }: EntityInspectorProps) {
  return (
    <div>
      <h1>Entity Inspector</h1>

      <div style={{ marginTop: '1rem' }}>
        <p><strong>Total entities:</strong> {inspectorData.length}</p>
        <p><strong>Component types found:</strong> {componentNames.length}</p>
      </div>
      
      <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ 
                border: '1px solid #ccc', 
                padding: '8px', 
                textAlign: 'left',
                position: 'sticky',
                left: 0,
                backgroundColor: '#f0f0f0',
                zIndex: 1
              }}>
                Entity ID
              </th>
              {componentNames.map(name => (
                <th key={name} style={{ 
                  border: '1px solid #ccc', 
                  padding: '8px', 
                  textAlign: 'left',
                  whiteSpace: 'nowrap'
                }}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inspectorData.map(entity => (
              <tr key={entity.entityId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ 
                  border: '1px solid #ccc', 
                  padding: '8px',
                  fontWeight: 'bold',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'white',
                  zIndex: 1
                }}>
                  {entity.entityId}
                </td>
                {componentNames.map(name => {
                  const componentData = entity.components[name];
                  const hasData = componentData !== undefined && componentData !== null;
                  const jsonString = hasData ? JSON.stringify(componentData, null, 2) : '';
                  
                  return (
                    <td key={name} style={{ 
                      border: '1px solid #ccc', 
                      padding: '8px',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: hasData ? 'inherit' : '#999'
                    }}
                    title={jsonString}>
                      {hasData ? jsonString : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       
      <div style={{ marginTop: '1rem' }}>
        <a href="#menu">← Back to Menu</a>
      </div>
    </div>
  );
}
