// KonvaはTransformerの生成（new Konva.Line）と instanceof の判定に値として使うため、
// import type にはしない。この2箇所が型専用の用法に変わると isolatedModules 下で
// importが黙って落ちるので注意する
import Konva from "konva";

export type UseKonvaSnappingParams = {
  snapRange?: number;
  guidelineColor?: string;
  guidelineDash?: boolean;
  showGuidelines?: boolean;
  guidelineThickness?: number;
  snapToStageCenter?: boolean;
  snapToStageBorders?: boolean;
  snapToShapes?: boolean;
};

export type UseKonvaSnappingResult = {
  handleDragging: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleResizing: (e: Konva.KonvaEventObject<Event>) => void;
  handleResizeEnd: (e: Konva.KonvaEventObject<Event>) => void;
  handleDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
};

// KonvaはNode.attrsをanyで宣言しているため、必要な範囲だけ型を付けて読む。
// width/heightは未設定でありうるが、undefinedのままNaNを伝播させる現行の挙動を保つ。
// Konvaのwidth()/height()は未設定時に既定値0を返すため置き換えてはいけない
type StageAttrs = { width: number; height: number };

export const useKonvaSnapping = (
  params: UseKonvaSnappingParams,
): UseKonvaSnappingResult => {
  const defaultParams = {
    snapRange: params.snapRange ?? 3,
    guidelineColor: params.guidelineColor ?? "rgb(0, 161, 255)",
    guidelineDash: params.guidelineDash ?? true,
    showGuidelines: params.showGuidelines ?? true,
    guidelineThickness: params.guidelineThickness ?? 1,
    snapToStageCenter: params.snapToStageCenter ?? true,
    snapToStageBorders: params.snapToStageBorders ?? true,
    snapToShapes: params.snapToShapes ?? true,
  };
  // 4つの角以外（"middle-right"・"top-center"・"rotater"等）はundefinedへ落ちる必要があるため、
  // キーをunionに絞らずRecord<string, string>で宣言する
  const oppositeAnchors: Record<string, string> = {
    "top-left": "bottom-right",
    "top-right": "bottom-left",
    "bottom-right": "top-left",
    "bottom-left": "top-right",
  };

  const getSnappingPoints = (e: Konva.KonvaEventObject<unknown>) => {
    const { snapToStageCenter, snapToStageBorders, snapToShapes } =
      defaultParams;
    const stage = e.currentTarget.getStage()!;
    const vertical: number[] = [];
    const horizontal: number[] = [];
    if (snapToStageCenter) {
      vertical.push((stage.attrs as StageAttrs).width / 2);
      horizontal.push((stage.attrs as StageAttrs).height / 2);
    }
    if (snapToStageBorders) {
      horizontal.push(0, (stage.attrs as StageAttrs).height);
      vertical.push(0, (stage.attrs as StageAttrs).width);
    }
    if (snapToShapes) {
      stage.children.forEach((layer) => {
        layer.children.forEach((obj) => {
          const box = obj.getClientRect();

          if (
            obj.getType() === "Shape" &&
            e.target !== obj &&
            obj.name() !== "guid-line" &&
            !(obj instanceof Konva.Transformer)
          ) {
            vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
            horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
          }
        });
      });
    }

    return { vertical, horizontal };
  };

  const createLine = (
    layer: Konva.Container,
    isHorizontal: boolean,
    lineX: number,
    lineY: number,
  ) => {
    const {
      guidelineColor,
      showGuidelines,
      guidelineThickness,
      guidelineDash,
    } = defaultParams;
    if (!showGuidelines) return;
    const points = isHorizontal ? [-6000, 0, 6000, 0] : [0, -6000, 0, 6000];
    const line = new Konva.Line({
      points,
      stroke: guidelineColor,
      strokeWidth: guidelineThickness,
      name: "guid-line",
      dash: guidelineDash ? [4, 6] : [0, 0],
    });
    layer.add(line);
    line.absolutePosition({ x: lineX, y: lineY });
  };
  function dotProduct(v1: Konva.Vector2d, v2: Konva.Vector2d) {
    return v1.x * v2.x + v1.y * v2.y;
  }

  function vectorProject(a: Konva.Vector2d, b: Konva.Vector2d) {
    const dotAB = dotProduct(a, b);
    const dotBB = dotProduct(b, b);
    const scalar = dotAB / dotBB;
    return {
      x: scalar * b.x,
      y: scalar * b.y,
    };
  }

  function calculateSlope(point1: Konva.Vector2d, point2: Konva.Vector2d) {
    const deltaX = point2.x - point1.x;

    // Check for a vertical line to avoid division by zero
    if (deltaX === 0) {
      throw new Error(
        `Slope is undefined for vertical lines (deltaX is zero). ${point2.x}, ${point1.x}`,
      );
    }

    const deltaY = point2.y - point1.y;
    return deltaY / deltaX;
  }

  const handleDragging = (e: Konva.KonvaEventObject<DragEvent>) => {
    const layer = e.target.parent!;

    // Clear existing guidelines
    layer.find<Konva.Node>(".guid-line").forEach((line) => line.destroy());
    const { horizontal, vertical } = getSnappingPoints(e);
    let newPos = {
      x: e.target.absolutePosition().x,
      y: e.target.absolutePosition().y,
    };
    let guideLinesX: number[] = [];
    let guideLinesY: number[] = [];
    const { snapRange } = defaultParams;
    // Snap vertically
    vertical.forEach((breakPoint) => {
      if (Math.abs(e.target.getClientRect().x - breakPoint) <= snapRange) {
        newPos.x =
          breakPoint +
          e.target.absolutePosition().x -
          e.target.getClientRect().x;
        guideLinesX.push(breakPoint);
      }
      if (
        Math.abs(
          e.target.getClientRect().x -
            breakPoint +
            e.target.getClientRect().width / 2,
        ) <= snapRange
      ) {
        newPos.x =
          breakPoint +
          e.target.absolutePosition().x -
          e.target.getClientRect().x -
          e.target.getClientRect().width / 2;
        guideLinesX.push(breakPoint);
      }
      if (
        Math.abs(
          e.target.getClientRect().x -
            breakPoint +
            e.target.getClientRect().width,
        ) <= snapRange
      ) {
        newPos.x =
          breakPoint +
          e.target.absolutePosition().x -
          e.target.getClientRect().x -
          e.target.getClientRect().width;
        guideLinesX.push(breakPoint);
      }
    });
    e.target.absolutePosition(newPos);
    guideLinesX.forEach((line) => {
      if (
        Math.round(e.target.getClientRect().x - line) === 0 ||
        Math.round(
          e.target.getClientRect().x -
            line +
            e.target.getClientRect().width / 2,
        ) === 0 ||
        Math.round(
          e.target.getClientRect().x - line + e.target.getClientRect().width,
        ) === 0
      ) {
        createLine(layer, false, line, 0);
      }
    });
    // Snap horizontally
    horizontal.forEach((breakPoint) => {
      if (Math.abs(e.target.getClientRect().y - breakPoint) <= snapRange) {
        newPos.y =
          breakPoint +
          e.target.absolutePosition().y -
          e.target.getClientRect().y;
        guideLinesY.push(breakPoint);
      }
      if (
        Math.abs(
          e.target.getClientRect().y -
            breakPoint +
            e.target.getClientRect().height,
        ) <= snapRange
      ) {
        newPos.y =
          breakPoint +
          e.target.absolutePosition().y -
          e.target.getClientRect().y -
          e.target.getClientRect().height;
        guideLinesY.push(breakPoint);
      }
      if (
        Math.abs(
          e.target.getClientRect().y -
            breakPoint +
            e.target.getClientRect().height / 2,
        ) <= snapRange
      ) {
        newPos.y =
          breakPoint +
          e.target.absolutePosition().y -
          e.target.getClientRect().y -
          e.target.getClientRect().height / 2;
        guideLinesY.push(breakPoint);
      }
    });
    e.target.absolutePosition(newPos);
    guideLinesY.forEach((line) => {
      if (
        Math.round(e.target.getClientRect().y - line) === 0 ||
        Math.round(
          e.target.getClientRect().y - line + e.target.getClientRect().height,
        ) === 0 ||
        Math.round(
          e.target.getClientRect().y -
            line +
            e.target.getClientRect().height / 2,
        ) === 0
      ) {
        createLine(layer, true, 0, line);
      }
    });
  };

  const handleResizing = (e: Konva.KonvaEventObject<Event>) => {
    const layer = e.target.parent!;
    // react-konvaはonTransformのcurrentTargetをNodeとして型付けするが、このハンドラは
    // Transformerに結び付けて使う契約になっている。ここで束ねてよいのは参照のaliasだけで、
    // _movingAnchorNameとgetActiveAnchor()の読み取りは登録時とドラッグ時で値が変わるため
    // 意図的にコールバック内へ残してある。巻き上げてはいけない
    const transformer = e.currentTarget as Konva.Transformer;
    const { snapRange } = defaultParams;

    let { horizontal, vertical } = getSnappingPoints(e);
    if (
      !transformer.keepRatio() ||
      (transformer.keepRatio() &&
        !!!oppositeAnchors[transformer._movingAnchorName!])
    ) {
      transformer.anchorDragBoundFunc(
        (
          oldAbsPos: Konva.Vector2d,
          newAbsPos: Konva.Vector2d,
          event: MouseEvent,
        ) => {
          layer
            .find<Konva.Node>(".guid-line")
            .forEach((line) => line.destroy());
          let bounds = { x: newAbsPos.x, y: newAbsPos.y };
          if (transformer.getActiveAnchor() === "rotater") return bounds;
          for (let breakPoint of vertical) {
            if (
              Math.abs(newAbsPos.x - breakPoint) <= snapRange &&
              Math.abs(oldAbsPos.x - breakPoint) <= snapRange + 1
            ) {
              bounds.x = breakPoint;
              createLine(layer, false, breakPoint, 0);
              break;
            }
          }
          for (let breakPoint of horizontal) {
            if (
              Math.abs(newAbsPos.y - breakPoint) <= snapRange &&
              Math.abs(oldAbsPos.y - breakPoint) <= snapRange + 1
            ) {
              bounds.y = breakPoint;
              createLine(layer, true, 0, breakPoint);
              break;
            }
          }

          return bounds;
        },
      );
    } else {
      transformer.anchorDragBoundFunc(
        (
          oldAbsPos: Konva.Vector2d,
          newPos: Konva.Vector2d,
          event: MouseEvent,
        ) => {
          layer
            .find<Konva.Node>(".guid-line")
            .forEach((line) => line.destroy());
          const currentAnchorName = transformer._movingAnchorName;
          const oppositeAnchorName = oppositeAnchors[currentAnchorName!];

          const movingAnchor = transformer.findOne(`.${currentAnchorName}`);
          // Capture the anchor's starting absolute position:
          const anchorStartPosition = movingAnchor!.getAbsolutePosition();

          // Do nothing for the rotater anchor.
          if (currentAnchorName === "rotater") {
            return newPos;
          }

          const oppositeElement = transformer.findOne(`.${oppositeAnchorName}`);
          if (!oppositeElement) return newPos;
          const oppositePoint = oppositeElement.getAbsolutePosition();

          const slope = calculateSlope(anchorStartPosition, oppositePoint);

          // Calculate the vector from the starting anchor position to the opposite anchor.
          const transformVector = {
            x: anchorStartPosition.x - oppositePoint.x,
            y: anchorStartPosition.y - oppositePoint.y,
          };

          // Compute the movement delta from the starting position.
          const delta = {
            x: newPos.x - anchorStartPosition.x,
            y: newPos.y - anchorStartPosition.y,
          };

          // Project the delta onto the transform vector.
          const projectedDelta = vectorProject(delta, transformVector);

          // Compute the candidate new position (before snapping).
          const nextPos = {
            x: anchorStartPosition.x + projectedDelta.x,
            y: anchorStartPosition.y + projectedDelta.y,
          };

          for (let breakPoint of horizontal) {
            if (Math.abs(nextPos.y - breakPoint) <= snapRange) {
              nextPos.y = breakPoint;
              nextPos.x =
                anchorStartPosition.x +
                (breakPoint - anchorStartPosition.y) / slope;
              createLine(layer, true, 0, breakPoint);
              break;
            }
          }
          for (let breakPoint of vertical) {
            if (Math.abs(nextPos.x - breakPoint) <= snapRange) {
              nextPos.x = breakPoint;
              nextPos.y =
                anchorStartPosition.y +
                slope * (breakPoint - anchorStartPosition.x);
              createLine(layer, false, breakPoint, 0);
              break;
            }
          }

          return nextPos;
        },
      );
    }
  };

  const handleResizeEnd = (e: Konva.KonvaEventObject<Event>) => {
    const layer = e.target.parent!;
    // handleResizingと同じく、currentTargetはTransformerに結び付けて使う契約
    (e.currentTarget as Konva.Transformer).anchorDragBoundFunc(
      (
        oldAbsPos: Konva.Vector2d,
        newPos: Konva.Vector2d,
        event: MouseEvent,
      ) => {
        return newPos;
      },
    );
    layer.find<Konva.Node>(".guid-line").forEach((line) => line.destroy());
  };
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const layer = e.target.parent!;
    layer.find<Konva.Node>(".guid-line").forEach((line) => line.destroy());
  };

  return { handleDragging, handleResizing, handleResizeEnd, handleDragEnd };
};
