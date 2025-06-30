import ReactGridLayout from 'react-grid-layout';
import React, { useEffect } from 'react';
import Operator from './Operator';
import { margin, operators, size } from '../data/operators';

// constants describing grid layout
const circuitContainerPadding = {
    x: 0,
    y: 0,
};
const containerPadding = {
    x: 10,
    y: 10,
};
const circuitLineMarginL = 40;
const circuitLineMarginR = 50;
const gridDimenY = 3; // Number of rows in the grid (qubits)
const gridDimenX = 10; // Number of columns in the grid

export default ({ droppingItem }) => {
    const [layout, setLayout] = React.useState([]); /* Layout of the circuit as 
    an array of objects, each representing a gate with properties:
        i - unique id
        gateId - the ID of the gate corresponding to the operator from operators.js
        x - x position in the grid (column)
        y - y position in the grid (row or qubit)
        w - width (number of columns it occupies, usually 1)
        h - height of the gate (range of qubits it occupies)
    */
    const [droppingItemHeight, setDroppingItemHeight] = React.useState(1); // Height of the dropping item, used to adjust the placeholder height during drag-and-drop of a new gate
    const [draggedItemId, setDraggedItemId] = React.useState(null); // ID of the item being dragged, used to handle drag-and-drop events of existing gates
    const [widthmap, setWidthMap] = React.useState(new Map());    
    const [layoutKey, setLayoutKey] = React.useState(0);
    const [debugLayout, setDebugLayout] = React.useState([]);
    const [gridKey, setGridKey] = React.useState(0);


useEffect(() => {
    console.log('layout updated:', layout);
    // Force the layout state to update by setting it again with new references
    const newLayout = layout.map(item => ({ ...item }));
    setLayout(newLayout);
    setDebugLayout([...newLayout]);
    setLayoutKey(Date.now());
    // Force ReactGridLayout to completely re-mount
    setGridKey(prev => prev + 1);
}, [JSON.stringify(layout)]); // Use JSON.stringify to detect actual content changes

    // Set the dropping item height for placeholder based on the height described in the operators array
    useEffect(() => {
        if (!droppingItem) {
            return;
        }
        setDroppingItemHeight(operators.find(op => op.id === droppingItem)?.height ?? 1);
    }, [droppingItem]);

    function normalizeLayout(updatedLayout) {
        for(var x=0;x<updatedLayout.length;x++)
        {
            for(const [key, value] of widthmap)
            {
                if(key===updatedLayout[x].i)
                {
                    updatedLayout[x].w=value;
                }
            }
        }
        return [...updatedLayout];
    }

    function fixOverlap(updatedLayout)
    {
        for(var i=0; i<updatedLayout.length;i++)
        {
            var shiftList=[]
            if(updatedLayout[i].w>1)
            {
                var nearestX=9999
                for(var j=0;j<updatedLayout.length;j++)
                {
                    if(i==j)
                    {
                        continue;
                    }
                    if( updatedLayout[j].x>updatedLayout[i].x)
                    {
                        shiftList.push(j);
                        if(updatedLayout[j].x<nearestX)
                        {
                            nearestX=updatedLayout[j].x;
                        }
                    }
                }
            }

            var endw=updatedLayout[i].x+updatedLayout[i].w;
            var toShift=Math.max(endw-nearestX, 0)
            if(toShift==0)
            {
                continue;
            }

            for(const item of shiftList)
            {
                updatedLayout[item].x=updatedLayout[item].x+toShift;
            }
        }

         return [...updatedLayout];
    }

    // Update the layout
    const handleCircuitChange = (newCircuit) => {
        const newLayout=normalizeLayout(newCircuit.layout);
        const fixedOverlap=fixOverlap(newLayout);
        console.log(fixedOverlap);
        setLayout(fixedOverlap.map(item => ({ ...item })));
    };

   

    const expandCG =(idstr) => {
        var id=parseInt(idstr,0);
        var newLayout=layout;
        for(var i=0;i<newLayout.length; i++)
        {   
            
            if(newLayout[i].i===idstr)
            {
                newLayout[i].w=4;
                newLayout[i].xray=true;
                widthmap.set(idstr,4);
            }
        }

        setWidthMap(widthmap);
        handleCircuitChange({
            layout: [...newLayout],
        });
    }

    
    const compressCG =(idstr) => {
        var id=parseInt(idstr.innerText,0);

        var newLayout=layout;
        for(var i=0;i<newLayout.length; i++)
        {
            if(newLayout[i].i===idstr)
            {
                newLayout[i].w=1;
                newLayout[i].xray=true;
                widthmap.set(idstr,1);
            }
        }
        setWidthMap(widthmap);
         handleCircuitChange({
            layout: [...newLayout],
        });
    }


    // Handle dropping a new gate onto the circuit
    const onDrop = (newLayout, layoutItem, event) => {
        event.preventDefault();

        let gateId = event.dataTransfer.getData('gateId');
        const isCustomGate = event.dataTransfer.getData('isCustomGate') === 'true';
        const height = operators.find(op => op.id === gateId)?.height || 1;

        if (layoutItem.y + height > gridDimenY) {
            return; // Prevent dropping if the gate exceeds the grid height
        }
        
        const newItem = {
            i: new Date().getTime().toString(), // unique id
            gateId: gateId,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: height,
            isResizable: false,
            xray: false,
        };
        const updatedLayout = newLayout.filter(
            item => item.i !== '__dropping-elem__' && item.y < gridDimenY,
        ).map(item => {
            return {
                ...item,
                gateId: layout.find(i => i.i === item.i)?.gateId,
            };
        });
        updatedLayout.push(newItem);
        
        handleCircuitChange({
            layout: updatedLayout,
        });

        return;
    };

    // Update the layout when a gate is dragged and dropped
    const handleDragStop = (newLayout) => {
        if (!draggedItemId) {
            console.error('Dragged item ID is missing on drag stop!');
            return;
        }
        const updatedLayout = newLayout.filter(
            item => item.i !== '__dropping-elem__' && item.y < gridDimenY,
        ).map(item => {
            return {
                ...item,
                gateId: layout.find(i => i.i === item.i)?.gateId,
            };
        });
        
        handleCircuitChange({
            layout: updatedLayout,
        });
        setDraggedItemId(null);
    }
const gridKeyElement = <p style={{display: 'none'}} id="grid-key-debug">{gridKey}</p>;
    return (
        <div className='relative bg-white border-2 border-gray-200 m-2 shadow-lg rounded-lg'
            style={{
                boxSizing: 'content-box',
                padding: `${circuitContainerPadding.y}px ${circuitContainerPadding.x}px`,
                minWidth: `${2 * containerPadding.x + gridDimenX * (size + margin.x)}px`,
                width: `${2 * containerPadding.x + (gridDimenX) * (size + margin.x) + size / 2 + margin.x}px`,
                height: `${2 * containerPadding.y + (gridDimenY) * (size + margin.y) - margin.y}px`, // +1 to account for classical bit
                overflow: 'hidden',
            }}
        >
            {...gridKeyElement}
            <div id='metadata' style={{display: 'none'}}>
                <p id='idstate'></p>
                <p id='idChange'></p>
                
                <button id='triggerShow' onClick={()=> {
                    const elem=document.getElementById('idstate');
                    expandCG(elem.innerText);
                }
                }></button>

            <button id='triggerHide' onClick={()=> {
                    const elem=document.getElementById('idstate');
                    compressCG(elem.innerText);
                }
                }></button>
            </div>           
            <ReactGridLayout
                {...gridKeyElement}
                allowOverlap={false}
                layout={layout}
                useCSSTransforms={false}
                className="relative z-20"
                cols={gridDimenX}
                compactType={null}
                containerPadding={[containerPadding.x, containerPadding.y]}
                droppingItem={{
                    i: '__dropping-elem__',
                    h: droppingItemHeight,
                    w: 1,
                }}
                isBounded={false}
                isDroppable={true}
                margin={[margin.x, margin.y]}
                onDrag={() => {
                    const placeholderEl = document.querySelector(
                        '.react-grid-placeholder',
                    );
                    if (placeholderEl) {
                        placeholderEl.style.backgroundColor =
                            'rgba(235, 53, 53, 0.2)';
                        placeholderEl.style.border = '2px dashed blue';
                    }
                }}
                onDragStart={(layout, oldItem) => {
                    const draggedItemId = oldItem?.i;
                    if (!draggedItemId) {
                        console.error('Dragged item ID is missing!');
                        return;
                    }
                    setDraggedItemId(prev => {
                        return draggedItemId;
                    });
                }}
                onDragStop={(layout, oldItem, newItem) => {
                    handleDragStop(layout);
                }}
                onDrop={onDrop}
                preventCollision={true}
                rowHeight={size}
                style={{
                    minHeight: `${2 * containerPadding.y + gridDimenY * (size + margin.y) - margin.y}px`,
                    maxHeight: `${2 * containerPadding.y + gridDimenY * (size + margin.y) - margin.y}px`,
                    overflowY: 'visible',
                    marginLeft: `${circuitLineMarginL}px`,
                    marginRight: `${circuitLineMarginR}px`,
                }}
                width={
                    gridDimenX *
                    (size + margin.x)
                }
            >
                {layout?.map((item, index) => {
                    const gate = operators.find(op => op.id === item.gateId);
                    if (!gate) {
                        console.warn(`Gate with ID ${item.gateId} not found in operators.`);
                        return null;
                    }
                    return (
                        <div
                            className="grid-item relative group"
                            data-grid={item}
                            key={`${item.i}`}
                        >
                            <Operator
                                itemId={item.i}
                                symbol={gate.icon}
                                height={gate.height}
                                width={gate.width}
                                fill={gate.fill}
                                isCustom={gate.isCustom}
                                components={gate.components ?? []}
                                xray={item.xray ?? false}
                            />
                        </div>
                    );
                })}
            </ReactGridLayout>
            <div className="absolute top-0 left-0 z-10"
                style={{
                    width: `${2 * containerPadding.x + (gridDimenX) * (size + margin.x) + size / 2}px`,
                }}>
                {[...new Array(gridDimenY)].map((_, index) => (
                    <div
                        className={'absolute flex group'}
                        key={index}
                        style={{
                            height: `${size}px`,
                            width: '100%',
                            top: `${circuitContainerPadding.y + containerPadding.y + index * size + size / 2 + index * margin.y}px`,
                            paddingLeft: `${circuitLineMarginL}px`,
                        }}
                    >
                        <div className="absolute top-0 -translate-y-1/2 left-2 font-mono">
                            Q<sub>{index}</sub>
                        </div>
                        <div
                            className="h-[1px] bg-gray-400 grow"
                            data-line={index}
                            data-val={index + 1}
                            key={`line-${index}`}
                        ></div>
                    </div>
                ))}
            </div>
          
        </div>
        
    );
}