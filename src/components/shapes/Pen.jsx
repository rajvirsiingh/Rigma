const Pen = ({shape, isSelected, onMouseDown}) => {
  return (
    <polyline
            points={shape.points.map(p => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={isSelected ? "blue" : "black"}
            strokeWidth="2"
            onMouseDown={onMouseDown}
        />
    )
  
}

export default Pen