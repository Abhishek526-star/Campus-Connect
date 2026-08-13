import { RotateCcw } from 'lucide-react';
import { DEPARTMENTS, INDUSTRIES } from '../../../constants/index.js';
import { Input } from '../../ui/Input.jsx';
import { Select } from '../../ui/Select.jsx';
import { Button } from '../../ui/Button.jsx';

const YEARS = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + 1 - i);

/**
 * Directory filters (spec §6): department, batch, company, industry,
 * location, designation, skills.
 */
export function PeopleFilters({ filters, onChange, onReset }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="Department"
          placeholder="All departments"
          value={filters.department}
          onChange={(event) => set('department', event.target.value)}
          options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
        />
        <Select
          label="Batch (graduation year)"
          placeholder="All batches"
          value={filters.graduationYear}
          onChange={(event) => set('graduationYear', event.target.value)}
          options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <Input
          label="Company"
          placeholder="e.g. Google"
          value={filters.company}
          onChange={(event) => set('company', event.target.value)}
        />
        <Select
          label="Industry"
          placeholder="All industries"
          value={filters.industry}
          onChange={(event) => set('industry', event.target.value)}
          options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
        />
        <Input
          label="Location"
          placeholder="e.g. Bengaluru"
          value={filters.location}
          onChange={(event) => set('location', event.target.value)}
        />
        <Input
          label="Designation"
          placeholder="e.g. SDE-II"
          value={filters.designation}
          onChange={(event) => set('designation', event.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Skills (comma separated)"
          placeholder="Python, React, DSA…"
          value={filters.skills}
          onChange={(event) => set('skills', event.target.value)}
        />
        <div className="flex items-end">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="size-3.5" aria-hidden="true" /> Reset filters
          </Button>
        </div>
      </div>
    </div>
  );
}
