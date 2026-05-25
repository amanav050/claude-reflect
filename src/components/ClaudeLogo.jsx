function ClaudeLogo({ size = 20, className = '', style = {} }) {
  const rays = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i * 30) * (Math.PI / 180)
    const innerR = 6
    const outerR = 46
    const spread = 7 * (Math.PI / 180)

    const x1 = 50 + innerR * Math.cos(angle - spread)
    const y1 = 50 + innerR * Math.sin(angle - spread)
    const x2 = 50 + outerR * Math.cos(angle)
    const y2 = 50 + outerR * Math.sin(angle)
    const x3 = 50 + innerR * Math.cos(angle + spread)
    const y3 = 50 + innerR * Math.sin(angle + spread)

    const cx = 50 + outerR * 0.6 * Math.cos(angle)
    const cy = 50 + outerR * 0.6 * Math.sin(angle)

    return `M${x1},${y1} Q${cx},${cy} ${x2},${y2} Q${cx},${cy} ${x3},${y3} Z`
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={style}
    >
      {rays.map((d, i) => (
        <path key={i} d={d} fill="currentColor" />
      ))}
      <circle cx="50" cy="50" r="8" fill="currentColor" />
    </svg>
  )
}

export default ClaudeLogo