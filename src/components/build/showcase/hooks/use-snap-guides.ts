export interface SnapGuide {
  type: "vertical" | "horizontal";
  position: number; // percentage (0-100)
}

export interface SnapResult {
  snappedX: number | null;
  snappedY: number | null;
  guides: SnapGuide[];
}

interface ElementRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SnapCandidate {
  distance: number;
  snapValue: number;
  guidePosition: number;
}

/**
 * Calculates snap positions when dragging/resizing elements in a showcase editor.
 * All coordinates are percentage-based (0-100%).
 *
 * This is a pure function (not a React hook) intended to be called inside
 * pointer event handlers.
 */
export function calcSnapGuides(
  elements: ElementRect[],
  activeId: string | null,
  activeRect: Rect | null,
  threshold: number = 1
): SnapResult {
  const result: SnapResult = {
    snappedX: null,
    snappedY: null,
    guides: [],
  };

  if (!activeId || !activeRect) {
    return result;
  }

  // Collect vertical snap targets (x-axis positions)
  const verticalTargets: number[] = [0, 50, 100];

  // Collect horizontal snap targets (y-axis positions)
  const horizontalTargets: number[] = [0, 50, 100];

  for (const el of elements) {
    if (el.id === activeId) continue;

    // Other elements' edges and centers as vertical targets
    verticalTargets.push(el.x, el.x + el.width, el.x + el.width / 2);

    // Other elements' edges and centers as horizontal targets
    horizontalTargets.push(el.y, el.y + el.height, el.y + el.height / 2);
  }

  // Active element's snap reference points
  const activeLeft = activeRect.x;
  const activeRight = activeRect.x + activeRect.width;
  const activeCenterX = activeRect.x + activeRect.width / 2;

  const activeTop = activeRect.y;
  const activeBottom = activeRect.y + activeRect.height;
  const activeCenterY = activeRect.y + activeRect.height / 2;

  // Find best vertical snap (X axis)
  let bestVertical: SnapCandidate | null = null;

  for (const target of verticalTargets) {
    const candidates: Array<{ distance: number; offset: number }> = [
      { distance: Math.abs(activeLeft - target), offset: target - activeLeft },
      { distance: Math.abs(activeRight - target), offset: target - activeRight },
      { distance: Math.abs(activeCenterX - target), offset: target - activeCenterX },
    ];

    for (const candidate of candidates) {
      if (candidate.distance <= threshold) {
        if (!bestVertical || candidate.distance < bestVertical.distance) {
          bestVertical = {
            distance: candidate.distance,
            snapValue: activeRect.x + candidate.offset,
            guidePosition: target,
          };
        }
      }
    }
  }

  // Find best horizontal snap (Y axis)
  let bestHorizontal: SnapCandidate | null = null;

  for (const target of horizontalTargets) {
    const candidates: Array<{ distance: number; offset: number }> = [
      { distance: Math.abs(activeTop - target), offset: target - activeTop },
      { distance: Math.abs(activeBottom - target), offset: target - activeBottom },
      { distance: Math.abs(activeCenterY - target), offset: target - activeCenterY },
    ];

    for (const candidate of candidates) {
      if (candidate.distance <= threshold) {
        if (!bestHorizontal || candidate.distance < bestHorizontal.distance) {
          bestHorizontal = {
            distance: candidate.distance,
            snapValue: activeRect.y + candidate.offset,
            guidePosition: target,
          };
        }
      }
    }
  }

  if (bestVertical) {
    result.snappedX = bestVertical.snapValue;
    result.guides.push({
      type: "vertical",
      position: bestVertical.guidePosition,
    });
  }

  if (bestHorizontal) {
    result.snappedY = bestHorizontal.snapValue;
    result.guides.push({
      type: "horizontal",
      position: bestHorizontal.guidePosition,
    });
  }

  return result;
}
