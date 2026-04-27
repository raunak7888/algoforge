'use client';

import { useEffect, useState } from 'react';

type Category = {
  id: string;
  label: string;
  description?: string;
};

type Algorithm = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  difficulty: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  tags: string[];
};

export default function AdminViewer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🚀 Fetch Categories
  async function fetchCategories() {
    const res = await fetch('http://localhost:4000/api/categories', {
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch categories');

    setCategories(data);
  }

  // 🚀 Fetch Algorithms
  async function fetchAlgorithms(categoryId?: string) {
    const url = new URL('http://localhost:4000/api/algorithms');

    if (categoryId) {
      url.searchParams.append('categoryId', categoryId);
    }

    const res = await fetch(url.toString(), {
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch algorithms');

    setAlgorithms(data);
  }

  // 🚀 Initial load
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        await fetchCategories();
        await fetchAlgorithms();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // 🚀 Handle category filter
  async function handleCategoryClick(id: string) {
    setSelectedCategory(id);
    setLoading(true);
    setError(null);

    try {
      await fetchAlgorithms(id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🚀 Clear filter
  async function clearFilter() {
    setSelectedCategory(null);
    setLoading(true);
    setError(null);

    try {
      await fetchAlgorithms();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📚 Admin Viewer</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* 🟦 Categories */}
      <h3>Categories</h3>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={clearFilter}>All</button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            style={{
              background:
                selectedCategory === cat.id ? 'black' : 'lightgray',
              color: selectedCategory === cat.id ? 'white' : 'black',
              padding: '5px 10px',
              cursor: 'pointer',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 🟩 Algorithms */}
      <h3 style={{ marginTop: 20 }}>Algorithms</h3>

      {algorithms.length === 0 && <p>No algorithms found</p>}

      <div style={{ display: 'grid', gap: 10 }}>
        {algorithms.map((algo) => (
          <div
            key={algo.id}
            style={{
              border: '1px solid #ccc',
              padding: 10,
              borderRadius: 6,
            }}
          >
            <h4>{algo.name}</h4>
            <p>{algo.description}</p>

            <div style={{ fontSize: 12 }}>
              <div>Slug: {algo.slug}</div>
              <div>Difficulty: {algo.difficulty}</div>
              <div>Time: {algo.timeComplexity}</div>
              <div>Space: {algo.spaceComplexity}</div>
            </div>

            <div style={{ marginTop: 5 }}>
              {algo.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    marginRight: 5,
                    fontSize: 12,
                    background: '#eee',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}