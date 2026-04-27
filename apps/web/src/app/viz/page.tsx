"use client";

import { useState } from "react";

export default function AdminSeeder() {
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const CSRF_TOKEN = getCookie("af_csrf"); // read from browser cookie

    function logMsg(msg: string) {
        setLog((prev) => [...prev, msg]);
    }

    function getCookie(name: string) {
        if (typeof document === "undefined") return "";
        const match = document.cookie.match(
            new RegExp("(^| )" + name + "=([^;]+)"),
        );
        return match ? match[2] : "";
    }

    async function runSeeder() {
        setLoading(true);
        setLog([]);

        try {
            //   // 🚀 STEP 1: Create Category
            //   logMsg('Creating category...');

            //   const categoryRes = await fetch('http://localhost:4000/api/categories', {
            //     method: 'POST',
            //     credentials: 'include',
            //     headers: {
            //       'Content-Type': 'application/json',
            //       'X-CSRF-Token': CSRF_TOKEN,
            //     },
            //     body: JSON.stringify({
            //       label: 'Sorting',
            //       description: 'Sorting algorithms',
            //       iconName: 'ArrowUpDown',
            //       sortOrder: 1,
            //     }),
            //   });

            //   const categoryData = await categoryRes.json();

            //   if (!categoryRes.ok) {
            //     throw new Error(categoryData.error || 'Category failed');
            //   }

            //   const categoryId = categoryData.id;
            //   logMsg('✅ Category created: ' + categoryId);

            // 🚀 STEP 2: Create Algorithm

            const forgeBody = `const arr = [...input.array];
forge.init("array", "arr", arr);
forge.setMessage("Starting Bubble Sort");
forge.snap();
const n = arr.length;
for (let i = 0; i < n - 1; i++) {
  forge.setPhase("Pass " + (i + 1));
  for (let j = 0; j < n - 1 - i; j++) {
    forge.highlight("arr", [j, j + 1], "comparing");
    forge.setPointers("arr", { j: j, "j+1": j + 1 });
    forge.setMessage("Comparing " + arr[j] + " and " + arr[j + 1]);
    forge.snap();
    if (arr[j] > arr[j + 1]) {
      const tmp = arr[j];
      arr[j] = arr[j + 1];
      arr[j + 1] = tmp;
      forge.swap("arr", j, j + 1);
      forge.highlight("arr", [j, j + 1], "swapped");
      forge.setMessage("Swapped → " + arr[j] + " < " + arr[j + 1]);
      forge.snap();
    }
  }
  forge.markSorted("arr", n - 1 - i);
  forge.setMessage("Position " + (n - 1 - i) + " is now sorted");
  forge.snap();
}
forge.markAllSorted("arr");
forge.setMessage("Array is fully sorted!");
forge.done();`;

            logMsg("Creating algorithm...");

            // algorithm id = 5797ac97-a9b7-4146-8f6f-5217eeb0d7ca

            const algoRes = await fetch(
                "http://localhost:4000/api/algorithms",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": CSRF_TOKEN,
                    },
                    body: JSON.stringify({
                        slug: "bubble-sort",
                        name: "Bubble Sort",
                        description: "Comparison-based sorting algorithm",
                        categoryId: "44d42f8f-2a59-4215-8be0-8ac5d5ee2122",

                        forgeCode: {
                            version: 1, // ✅ REQUIRED
                            language: "js", // ✅ REQUIRED
                            body: forgeBody,
                            requiredStructures: ["array"], // ✅ REQUIRED
                        },

                        inputSchema: {
                            type: "object",
                            properties: {
                                array: {
                                    type: "array",
                                    items: { type: "number" },
                                },
                            },
                            required: ["array"],
                        },

                        guardRanges: {
                            arrayLength: { min: 1, max: 100 },
                        },

                        timeComplexity: "O(n^2)",
                        spaceComplexity: "O(1)",

                        difficulty: "beginner", // ✅ FIXED
                        tags: ["sorting"],
                        isPublished: true,
                    }),
                },
            );

            const algoData = await algoRes.json();

            if (!algoRes.ok) {
                throw new Error(algoData.error || "Algorithm failed");
            }

            logMsg("✅ Algorithm created: " + algoData.id);

            logMsg("🎉 DONE");
        } catch (err: any) {
            logMsg("❌ ERROR: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: 20 }}>
            <h2>Admin Seeder</h2>

            <button
                onClick={runSeeder}
                disabled={loading}
                style={{
                    padding: "10px 20px",
                    background: "black",
                    color: "white",
                    cursor: "pointer",
                }}
            >
                {loading ? "Running..." : "Run Seeder"}
            </button>

            <div style={{ marginTop: 20 }}>
                {log.map((l, i) => (
                    <div key={i}>{l}</div>
                ))}
            </div>
        </div>
    );
}
