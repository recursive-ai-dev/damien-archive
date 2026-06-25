import { CharacterSpec } from '../character/types';

/**
 * Edge point representing a point on the character's silhouette
 */
export interface EdgePoint {
  x: number;
  y: number;
  normal: { x: number; y: number }; // Normalized direction vector pointing outward
  curvature: number; // Measure of how curved the edge is at this point
  segment: 'head' | 'torso' | 'arm' | 'leg' | 'robe' | 'hair' | 'tail' | 'wing'; // Body segment this edge belongs to
}

/**
 * Configuration for edge detection and deformation
 */
export interface EdgeDetectionConfig {
  resolution: number; // Number of points to sample around each body part
  smoothingFactor: number; // How much to smooth the detected edges (0-1)
  deformationIntensity: number; // How much edges can deform during animation (0-1)
  velocitySensitivity: number; // How much velocity affects deformation (0-1)
}

/**
 * Default configuration for edge detection
 */
export const DEFAULT_EDGE_CONFIG: EdgeDetectionConfig = {
  resolution: 24, // Sample 24 points around each body part
  smoothingFactor: 0.7, // Moderate smoothing
  deformationIntensity: 0.5, // Moderate deformation
  velocitySensitivity: 0.6 // Moderate velocity sensitivity
};

/**
 * Detects edges from a character spec
 */
export function detectEdges(spec: CharacterSpec, config: EdgeDetectionConfig = DEFAULT_EDGE_CONFIG): EdgePoint[] {
  const edges: EdgePoint[] = [];
  
  // Head edges
  const headEdges = generateEllipseEdges(
    spec.cx, // Center x
    spec.cy - spec.neck_h - spec.head_ry, // Center y
    spec.head_rx, // Radius x
    spec.head_ry, // Radius y
    config.resolution,
    'head'
  );
  edges.push(...headEdges);
  
  // Torso edges
  const torsoEdges = generateRoundedRectEdges(
    spec.cx - spec.s_half, // Left
    spec.cy - spec.neck_h, // Top
    spec.cx + spec.s_half, // Right
    spec.cy + spec.h_half, // Bottom
    Math.min(spec.s_half, spec.h_half) * 0.3, // Corner radius
    config.resolution,
    'torso'
  );
  edges.push(...torsoEdges);
  
  // Arms
  if (spec.arm_thickness > 0) {
    // Left arm
    const leftArmEdges = generateCapsuleEdges(
      spec.cx - spec.s_half, // Start x
      spec.cy - spec.neck_h + spec.shoulder_h, // Start y
      spec.cx - spec.s_half - spec.arm_length, // End x
      spec.cy - spec.neck_h + spec.shoulder_h, // End y
      spec.arm_thickness, // Radius
      config.resolution / 2,
      'arm'
    );
    edges.push(...leftArmEdges);
    
    // Right arm
    const rightArmEdges = generateCapsuleEdges(
      spec.cx + spec.s_half, // Start x
      spec.cy - spec.neck_h + spec.shoulder_h, // Start y
      spec.cx + spec.s_half + spec.arm_length, // End x
      spec.cy - spec.neck_h + spec.shoulder_h, // End y
      spec.arm_thickness, // Radius
      config.resolution / 2,
      'arm'
    );
    edges.push(...rightArmEdges);
  }
  
  // Legs
  const legY = spec.cy + spec.h_half;
  const legGap = spec.leg_gap || 0;
  
  // Left leg
  const leftLegEdges = generateCapsuleEdges(
    spec.cx - legGap / 2, // Start x
    legY, // Start y
    spec.cx - legGap / 2, // End x
    legY + spec.leg_h, // End y
    spec.leg_w / 2, // Radius
    config.resolution / 2,
    'leg'
  );
  edges.push(...leftLegEdges);
  
  // Right leg
  const rightLegEdges = generateCapsuleEdges(
    spec.cx + legGap / 2, // Start x
    legY, // Start y
    spec.cx + legGap / 2, // End x
    legY + spec.leg_h, // End y
    spec.leg_w / 2, // Radius
    config.resolution / 2,
    'leg'
  );
  edges.push(...rightLegEdges);
  
  // Robe (if present)
  if (spec.robe) {
    const robeEdges = generateRobeEdges(spec, config.resolution, 'robe');
    edges.push(...robeEdges);
  }
  
  // Hair (if present)
  if (spec.hair) {
    const hairEdges = generateHairEdges(spec, config.resolution, 'hair');
    edges.push(...hairEdges);
  }
  
  return smoothEdges(edges, config.smoothingFactor);
}

/**
 * Deforms edges based on motion parameters
 */
export function deformEdges(
  edges: EdgePoint[], 
  velocity: { x: number; y: number }, 
  acceleration: { x: number; y: number },
  config: EdgeDetectionConfig = DEFAULT_EDGE_CONFIG,
  speciesDeformFactor: number = 0.5
): EdgePoint[] {
  const deformedEdges = [...edges];
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  const accelMagnitude = Math.sqrt(acceleration.x * acceleration.x + acceleration.y * acceleration.y);
  
  // Normalize velocity and acceleration for deformation calculation
  const normVelocity = speed > 0 ? { x: velocity.x / speed, y: velocity.y / speed } : { x: 0, y: 0 };
  const normAccel = accelMagnitude > 0 ? 
    { x: acceleration.x / accelMagnitude, y: acceleration.y / accelMagnitude } : 
    { x: 0, y: 0 };
  
  // Calculate deformation factor based on motion
  const motionDeformFactor = speed * config.velocitySensitivity * config.deformationIntensity;
  
  // Apply deformation to each edge point
  for (let i = 0; i < deformedEdges.length; i++) {
    const edge = deformedEdges[i];
    
    // Calculate dot product between edge normal and velocity
    const normalDotVelocity = edge.normal.x * normVelocity.x + edge.normal.y * normVelocity.y;
    
    // Calculate deformation amount based on motion and species factor
    let deformAmount = 0;
    
    // Deform based on velocity (stretching in direction of movement)
    deformAmount -= normalDotVelocity * motionDeformFactor;
    
    // Add species-specific deformation factor
    deformAmount *= speciesDeformFactor;
    
    // Apply curvature-based deformation (more deformation at high-curvature points)
    deformAmount *= (1 + edge.curvature);
    
    // Apply segment-specific deformation rules
    switch (edge.segment) {
      case 'hair':
        // Hair deforms more
        deformAmount *= 1.5;
        break;
      case 'robe':
        // Robes deform more and have inertia
        deformAmount *= 1.8;
        // Add acceleration-based deformation for cloth physics
        const accelDeform = -(edge.normal.x * normAccel.x + edge.normal.y * normAccel.y) * 
                           accelMagnitude * config.velocitySensitivity * 0.5;
        deformAmount += accelDeform;
        break;
      case 'wing':
        // Wings deform based on flapping
        deformAmount *= 1.3;
        break;
      case 'tail':
        // Tails have more inertia
        deformAmount *= 1.4;
        break;
    }
    
    // Apply the deformation to the edge point
    deformedEdges[i] = {
      ...edge,
      x: edge.x + edge.normal.x * deformAmount,
      y: edge.y + edge.normal.y * deformAmount
    };
  }
  
  return deformedEdges;
}

/**
 * Smooths edges to reduce jaggedness
 */
function smoothEdges(edges: EdgePoint[], smoothingFactor: number): EdgePoint[] {
  if (smoothingFactor <= 0) return edges;
  
  const smoothedEdges = [...edges];
  
  // Group edges by segment for separate smoothing
  const segmentGroups: Record<string, EdgePoint[]> = {};
  
  for (const edge of edges) {
    if (!segmentGroups[edge.segment]) {
      segmentGroups[edge.segment] = [];
    }
    segmentGroups[edge.segment].push(edge);
  }
  
  // Smooth each segment group separately
  for (const segment in segmentGroups) {
    const segmentEdges = segmentGroups[segment];
    const n = segmentEdges.length;
    
    if (n <= 2) continue; // Need at least 3 points for smoothing
    
    // Create a copy of the original points for reference
    const originalPoints = [...segmentEdges];
    
    // Apply smoothing
    for (let i = 0; i < n; i++) {
      const prev = originalPoints[(i - 1 + n) % n];
      const curr = originalPoints[i];
      const next = originalPoints[(i + 1) % n];
      
      // Weighted average for position
      segmentEdges[i].x = prev.x * smoothingFactor/4 + curr.x * (1 - smoothingFactor/2) + next.x * smoothingFactor/4;
      segmentEdges[i].y = prev.y * smoothingFactor/4 + curr.y * (1 - smoothingFactor/2) + next.y * smoothingFactor/4;
      
      // Recalculate normal based on adjacent points
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len > 0) {
        // Normal is perpendicular to the tangent
        segmentEdges[i].normal = {
          x: -dy / len,
          y: dx / len
        };
      }
      
      // Calculate curvature (approximation)
      const prevDx = curr.x - prev.x;
      const prevDy = curr.y - prev.y;
      const nextDx = next.x - curr.x;
      const nextDy = next.y - curr.y;
      
      const prevLen = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
      const nextLen = Math.sqrt(nextDx * nextDx + nextDy * nextDy);
      
      if (prevLen > 0 && nextLen > 0) {
        const dotProduct = (prevDx * nextDx + prevDy * nextDy) / (prevLen * nextLen);
        // Convert dot product to curvature measure (0-1)
        segmentEdges[i].curvature = (1 - dotProduct) / 2;
      }
    }
  }
  
  return smoothedEdges;
}

/**
 * Generates edge points for an ellipse
 */
function generateEllipseEdges(
  centerX: number, 
  centerY: number, 
  radiusX: number, 
  radiusY: number, 
  resolution: number,
  segment: EdgePoint['segment']
): EdgePoint[] {
  const edges: EdgePoint[] = [];
  
  for (let i = 0; i < resolution; i++) {
    const angle = (i / resolution) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radiusX;
    const y = centerY + Math.sin(angle) * radiusY;
    
    // Calculate normal (pointing outward)
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    
    edges.push({
      x,
      y,
      normal: { x: nx, y: ny },
      curvature: 0.5, // Constant curvature for ellipse
      segment
    });
  }
  
  return edges;
}

/**
 * Generates edge points for a rounded rectangle
 */
function generateRoundedRectEdges(
  left: number,
  top: number,
  right: number,
  bottom: number,
  cornerRadius: number,
  resolution: number,
  segment: EdgePoint['segment']
): EdgePoint[] {
  const edges: EdgePoint[] = [];
  const width = right - left;
  const height = bottom - top;
  
  // Ensure corner radius isn't too large
  const maxRadius = Math.min(width, height) / 2;
  const radius = Math.min(cornerRadius, maxRadius);
  
  // Calculate points per side
  const pointsPerSide = Math.floor(resolution / 4);
  const pointsPerCorner = Math.floor(pointsPerSide / 2);
  
  // Top side
  for (let i = 0; i < pointsPerSide; i++) {
    let x, y, nx, ny;
    
    if (i < pointsPerCorner) {
      // Top-left corner
      const angle = Math.PI + (i / pointsPerCorner) * (Math.PI / 2);
      x = left + radius + Math.cos(angle) * radius;
      y = top + radius + Math.sin(angle) * radius;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    } else if (i >= pointsPerSide - pointsPerCorner) {
      // Top-right corner
      const angle = Math.PI * 1.5 + (i - (pointsPerSide - pointsPerCorner)) / pointsPerCorner * (Math.PI / 2);
      x = right - radius + Math.cos(angle) * radius;
      y = top + radius + Math.sin(angle) * radius;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    } else {
      // Top edge
      const t = (i - pointsPerCorner) / (pointsPerSide - pointsPerCorner * 2);
      x = left + radius + t * (width - radius * 2);
      y = top;
      nx = 0;
      ny = -1;
    }
    
    edges.push({
      x,
      y,
      normal: { x: nx, y: ny },
      curvature: i < pointsPerCorner || i >= pointsPerSide - pointsPerCorner ? 0.5 : 0,
      segment
    });
  }
  
  // Right side
  for (let i = 0; i < pointsPerSide; i++) {
    let x, y, nx, ny;
    
    if (i < pointsPerCorner) {
      // Top-right corner (already covered)
      continue;
    } else if (i >= pointsPerSide - pointsPerCorner) {
      // Bottom-right corner
      const angle = 0 + (i - (pointsPerSide - pointsPerCorner)) / pointsPerCorner * (Math.PI / 2);
      x = right - radius + Math.cos(angle) * radius;
      y = bottom - radius + Math.sin(angle) * radius;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    } else {
      // Right edge
      const t = (i - pointsPerCorner) / (pointsPerSide - pointsPerCorner * 2);
      x = right;
      y = top + radius + t * (height - radius * 2);
      nx = 1;
      ny = 0;
    }
    
    edges.push({
      x,
      y,
      normal: { x: nx, y: ny },
      curvature: i < pointsPerCorner || i >= pointsPerSide - pointsPerCorner ? 0.5 : 0,
      segment
    });
  }
  
  // Bottom side
  for (let i = 0; i < pointsPerSide; i++) {
    let x, y, nx, ny;
    
    if (i < pointsPerCorner) {
      // Bottom-right corner (already covered)
      continue;
    } else if (i >= pointsPerSide - pointsPerCorner) {
      // Bottom-left corner
      const angle = Math.PI / 2 + (i - (pointsPerSide - pointsPerCorner)) / pointsPerCorner * (Math.PI / 2);
      x = left + radius + Math.cos(angle) * radius;
      y = bottom - radius + Math.sin(angle) * radius;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    } else {
      // Bottom edge
      const t = (i - pointsPerCorner) / (pointsPerSide - pointsPerCorner * 2);
      x = right - radius - t * (width - radius * 2);
      y = bottom;
      nx = 0;
      ny = 1;
    }
    
    edges.push({
      x,
      y,
      normal: { x: nx, y: ny },
      curvature: i < pointsPerCorner || i >= pointsPerSide - pointsPerCorner ? 0.5 : 0,
      segment
    });
  }
  
  // Left side
  for (let i = 0; i < pointsPerSide; i++) {
    let x, y, nx, ny;
    
    if (i < pointsPerCorner) {
      // Bottom-left corner (already covered)
      continue;
    } else if (i >= pointsPerSide - pointsPerCorner) {
      // Top-left corner (connects back to start)
      const angle = Math.PI + (i - (pointsPerSide - pointsPerCorner)) / pointsPerCorner * (Math.PI / 2);
      x = left + radius + Math.cos(angle) * radius;
      y = top + radius + Math.sin(angle) * radius;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    } else {
      // Left edge
      const t = (i - pointsPerCorner) / (pointsPerSide - pointsPerCorner * 2);
      x = left;
      y = bottom - radius - t * (height - radius * 2);
      nx = -1;
      ny = 0;
    }
    
    edges.push({
      x,
      y,
      normal: { x: nx, y: ny },
      curvature: i < pointsPerCorner || i >= pointsPerSide - pointsPerCorner ? 0.5 : 0,
      segment
    });
  }
  
  return edges;
}

/**
 * Generates edge points for a capsule shape (cylinder with rounded ends)
 */
function generateCapsuleEdges(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  radius: number,
  resolution: number,
  segment: EdgePoint['segment']
): EdgePoint[] {
  const edges: EdgePoint[] = [];
  
  // Calculate capsule direction and length
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize direction
  const nx = length > 0 ? dx / length : 1;
  const ny = length > 0 ? dy / length : 0;
  
  // Perpendicular direction
  const px = -ny;
  const py = nx;
  
  // Points per semicircle
  const pointsPerCap = Math.floor(resolution / 2);
  
  // Start cap
  for (let i = 0; i < pointsPerCap; i++) {
    const angle = Math.PI / 2 + (i / pointsPerCap) * Math.PI;
    const x = startX + Math.cos(angle) * radius * px - Math.sin(angle) * radius * nx;
    const y = startY + Math.cos(angle) * radius * py - Math.sin(angle) * radius * ny;
    
    // Normal pointing outward
    const normalX = Math.cos(angle) * px - Math.sin(angle) * nx;
    const normalY = Math.cos(angle) * py - Math.sin(angle) * ny;
    
    edges.push({
      x,
      y,
      normal: { x: normalX, y: normalY },
      curvature: 0.5, // Constant curvature for semicircle
      segment
    });
  }
  
  // End cap
  for (let i = 0; i < pointsPerCap; i++) {
    const angle = Math.PI * 3/2 + (i / pointsPerCap) * Math.PI;
    const x = endX + Math.cos(angle) * radius * px - Math.sin(angle) * radius * nx;
    const y = endY + Math.cos(angle) * radius * py - Math.sin(angle) * radius * ny;
    
    // Normal pointing outward
    const normalX = Math.cos(angle) * px - Math.sin(angle) * nx;
    const normalY = Math.cos(angle) * py - Math.sin(angle) * ny;
    
    edges.push({
      x,
      y,
      normal: { x: normalX, y: normalY },
      curvature: 0.5, // Constant curvature for semicircle
      segment
    });
  }
  
  return edges;
}

/**
 * Generates edge points for a robe
 */
function generateRobeEdges(
  spec: CharacterSpec,
  resolution: number,
  segment: EdgePoint['segment']
): EdgePoint[] {
  const edges: EdgePoint[] = [];
  
  if (!spec.robe) return edges;
  
  const robeTop = spec.cy + spec.h_half;
  const robeBottom = robeTop + (spec.robe_len_px || spec.leg_h);
  const robeWidth = spec.s_half * 2;
  const flare = spec.robe_flare_px || 0;
  
  // Left side of robe
  const leftPoints = Math.floor(resolution / 4);
  for (let i = 0; i < leftPoints; i++) {
    const t = i / (leftPoints - 1);
    const flareAmount = t * flare;
    
    const x = spec.cx - spec.s_half - flareAmount;
    const y = robeTop + t * (robeBottom - robeTop);
    
    edges.push({
      x,
      y,
      normal: { x: -1, y: 0 },
      curvature: 0,
      segment
    });
  }
  
  // Bottom of robe
  const bottomPoints = Math.floor(resolution / 2);
  for (let i = 0; i < bottomPoints; i++) {
    const t = i / (bottomPoints - 1);
    const x = spec.cx - spec.s_half - flare + t * (robeWidth + flare * 2);
    const y = robeBottom;
    
    edges.push({
      x,
      y,
      normal: { x: 0, y: 1 },
      curvature: 0,
      segment
    });
  }
  
  // Right side of robe
  const rightPoints = Math.floor(resolution / 4);
  for (let i = 0; i < rightPoints; i++) {
    const t = 1 - i / (rightPoints - 1);
    const flareAmount = t * flare;
    
    const x = spec.cx + spec.s_half + flareAmount;
    const y = robeTop + t * (robeBottom - robeTop);
    
    edges.push({
      x,
      y,
      normal: { x: 1, y: 0 },
      curvature: 0,
      segment
    });
  }
  
  return edges;
}

/**
 * Generates edge points for hair
 */
function generateHairEdges(
  spec: CharacterSpec,
  resolution: number,
  segment: EdgePoint['segment']
): EdgePoint[] {
  const edges: EdgePoint[] = [];
  
  if (!spec.hair) return edges;
  
  // Simple hair representation as additional points around the head
  const hairOffset = spec.head_ry * 0.3; // Hair extends beyond head
  const hairTop = spec.cy - spec.neck_h - spec.head_ry * 2;
  
  const hairPoints = resolution;
  for (let i = 0; i < hairPoints; i++) {
    const angle = Math.PI + (i / hairPoints) * Math.PI;
    const hairLength = hairOffset * (1 + 0.5 * Math.sin(i * 5)); // Varied hair length
    
    const x = spec.cx + Math.cos(angle) * (spec.head_rx + hairLength);
    const y = spec.cy - spec.neck_h - spec.head_ry + Math.sin(angle) * (spec.head_ry + hairLength);
    
    // Normal pointing outward
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    
    edges.push({
      x,
      y,
      normal: { x: nx, y: ny },
      curvature: 0.7, // High curvature for hair
      segment
    });
  }
  
  return edges;
}