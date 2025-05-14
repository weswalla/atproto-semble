"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AnnotationsPage() {
  const [annotations, setAnnotations] = useState([]);

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Annotations</h1>
        <Button>New Annotation</Button>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        {annotations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No annotations yet</p>
            <Button>Create your first annotation</Button>
          </div>
        ) : (
          <div>
            {/* Annotation list will go here */}
            <p>Your annotations will appear here</p>
          </div>
        )}
      </div>
    </>
  );
}
