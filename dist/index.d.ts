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
export declare const useKonvaSnapping: (params: UseKonvaSnappingParams) => UseKonvaSnappingResult;
