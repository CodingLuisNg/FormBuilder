import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../styles/SortableItem.css";
import { GripVertical } from "lucide-react";

type Props = {
    id: string;
    children: React.ReactNode;
};

/**
 * SortableItem component for rendering a draggable and sortable item.
 * @param {Object} props - The component props.
 * @param {string} props.id - The unique identifier for the sortable item.
 * @param {React.ReactNode} props.children - The content to be rendered inside the sortable item.
 * @returns {JSX.Element} The rendered SortableItem component.
 */
export default function SortableItem({ id, children }: Props) {
    // Hook to enable sortable functionality for the item.
    const {
        attributes, // Accessibility attributes for the sortable item.
        listeners, // Event listeners for drag-and-drop interactions.
        setNodeRef, // Ref callback to set the DOM node for the sortable item.
        transform, // Transformation applied to the item during dragging.
        transition, // Transition applied to the item during dragging.
        isDragging // Boolean indicating if the item is currently being dragged.
    } = useSortable({ id });

    // Inline styles for the sortable item, including transform and transition.
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef} // Sets the DOM node reference for the sortable item.
            style={style} // Applies the transform and transition styles.
            className={`sortable-card ${isDragging ? "dragging" : ""}`} // Adds a dragging class if the item is being dragged.
        >
            {/* Left drag handle: full height */}
            <div className="sortable-handle" {...attributes} {...listeners}>
                <GripVertical size={18} />
            </div>

            {/* Field content */}
            <div className="sortable-content">
                {children}
            </div>
        </div>
    );
}
