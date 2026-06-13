import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/property-form";

export const Route = createFileRoute("/pro/properties/new")({
  component: () => <PropertyForm mode="create" />,
});
