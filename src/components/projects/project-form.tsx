"use client";

import { Suspense } from "react";
import ProjectFormInner from "./project-form-inner";

export default function ProjectForm() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading project...
        </div>
      }
    >
      <ProjectFormInner />
    </Suspense>
  );
}
