import SelectionOutline from '../SelectionOutline';

const TextShape = ({ shape, isSelected, onMouseDown, onTextEdit, onMouseEnter, onMouseLeave }) => {
  const {
    x,
    y,
    text = 'Text',
    fontSize = 24,
    fontFamily = 'Arial',
    textAlign = 'left',
    rotation = 0,
    fillColor = '#000000',
  } = shape;

  const anchor = textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start';
  const boundsWidth = Math.max(0, text.length * (fontSize * 0.6));
  const boundsHeight = Math.max(0, fontSize * 1.2);
  const left = x + (textAlign === 'center' ? -boundsWidth / 2 : textAlign === 'right' ? -boundsWidth : 0);
  const top = y - boundsHeight * 0.8;

  return (
    <>
      <text
        x={x}
        y={y}
        fill={fillColor}
        fontSize={fontSize}
        fontFamily={fontFamily}
        textAnchor={anchor}
        transform={rotation ? `rotate(${rotation} ${x} ${y})` : undefined}
        onMouseDown={onMouseDown}
        onDoubleClick={(e) => { e.stopPropagation(); onTextEdit(); }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ userSelect: 'none', cursor: 'text' }}
      >
        {text}
      </text>
      {isSelected && (
        <>
          <SelectionOutline x={left} y={top} width={boundsWidth} height={boundsHeight} color={fillColor} />
        </>
      )}
    </>
  );
};

export default TextShape;
