import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/property-form";

export const Route = createFileRoute("/pro/properties/$id/edit")({
  component: EditProperty,
});

function EditProperty() {
  const { id } = Route.useParams();
  return <PropertyForm mode="edit" propertyId={id} />;
}
