"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Annotation Templates</h1>
        <Link href="/templates/create">
          <Button>Create Template</Button>
        </Link>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        {templates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No templates yet</p>
            <Link href="/templates/create">
              <Button>Create your first template</Button>
            </Link>
          </div>
        ) : (
          <div>
            {/* Template list will go here */}
            <p>Your templates will appear here</p>
          </div>
        )}
      </div>
    </>
  );
}
