import { Award, BookOpen, Briefcase, FolderGit2, GraduationCap, Medal, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card.jsx';
import { Tag } from '../../ui/Tag.jsx';
import { Badge } from '../../ui/Badge.jsx';
import { formatDate } from '../../../utils/format.js';
import { titleCase } from '../../../utils/format.js';

function Section({ title, icon: Icon, children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Icon className="size-4 text-primary-500" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** View-mode profile sections: about, skills, education, experience, achievements, projects, certifications. */
export function ProfileSections({ profile, role }) {
  if (!profile) return null;

  const hasAbout = profile.about || (profile.skills?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {hasAbout && (
        <Section title="About" icon={BookOpen}>
          {profile.about && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{profile.about}</p>}
          {profile.skills?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Tag key={skill} tone="primary">{skill}</Tag>
              ))}
            </div>
          )}
        </Section>
      )}

      {role === 'alumni' && (
        <Section title="Profile details" icon={Award}>
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ['Graduation year', profile.graduationYear],
              ['Degree', profile.degree],
              ['Department', profile.department],
              ['Industry', profile.industry],
              ['Current company', profile.currentCompany],
              ['Designation', profile.designation],
            ].map(([label, value]) =>
              value ? (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-slate-800">{value}</dd>
                </div>
              ) : null,
            )}
          </dl>
          {profile.mentorshipAreas?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-600">Mentorship areas</p>
              <div className="flex flex-wrap gap-2">
                {profile.mentorshipAreas.map((area) => (
                  <Badge key={area} tone="violet" size="sm">{titleCase(area)}</Badge>
                ))}
              </div>
              {profile.availableForMentorship && <Badge tone="success" size="sm" className="mt-2">Available for mentorship</Badge>}
            </div>
          )}
        </Section>
      )}

      {role === 'faculty' && (
        <Section title="Academic details" icon={Award}>
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ['Employee ID', profile.employeeId],
              ['Department', profile.department],
              ['Designation', profile.designation],
            ].map(([label, value]) =>
              value ? (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-slate-800">{value}</dd>
                </div>
              ) : null,
            )}
          </dl>
          {profile.subjects?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.subjects.map((subject) => (
                <Tag key={subject} tone="accent">{subject}</Tag>
              ))}
            </div>
          )}
        </Section>
      )}

      {role === 'student' && (
        <Section title="Academic details" icon={Award}>
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ['Roll number', profile.rollNumber],
              ['Department', profile.department],
              ['Course', profile.course],
              ['Year', `Year ${profile.year}`],
              ['Graduation year', profile.graduationYear],
            ].map(([label, value]) =>
              value ? (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-slate-800">{value}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </Section>
      )}

      {profile.education?.length > 0 && (
        <Section title="Education" icon={GraduationCap}>
          <ul className="space-y-4">
            {profile.education.map((item, index) => (
              <li key={index} className="border-l-2 border-primary-200 pl-4">
                <p className="text-sm font-semibold text-slate-900">
                  {item.degree}
                  {item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''}
                </p>
                <p className="text-xs text-slate-500">
                  {[item.institution, item.startYear && item.endYear ? `${item.startYear}–${item.endYear}` : item.startYear || item.endYear].filter(Boolean).join(' · ')}
                </p>
                {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {profile.experience?.length > 0 && (
        <Section title="Experience" icon={Briefcase}>
          <ul className="space-y-4">
            {profile.experience.map((item, index) => (
              <li key={index} className="border-l-2 border-accent-200 pl-4">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {[item.company, item.current ? 'Present' : item.startDate || item.endDate].filter(Boolean).join(' · ')}
                </p>
                {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {profile.achievements?.length > 0 && (
        <Section title="Achievements" icon={Medal}>
          <ul className="space-y-4">
            {profile.achievements.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <Medal className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                    {item.date && <span className="ml-2 text-xs font-normal text-slate-400">{formatDate(item.date)}</span>}
                  </p>
                  {item.description && <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>}
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block text-xs font-medium text-primary-600 hover:underline">
                      View link
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {profile.projects?.length > 0 && (
        <Section title="Projects" icon={FolderGit2}>
          <ul className="space-y-4">
            {profile.projects.map((item, index) => (
              <li key={index} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-600 hover:underline">
                      View →
                    </a>
                  )}
                </div>
                {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
                {item.techStack?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.techStack.map((tech) => (
                      <Badge key={tech} tone="slate" size="sm">{tech}</Badge>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {profile.certifications?.length > 0 && (
        <Section title="Certifications" icon={Star}>
          <ul className="space-y-4">
            {profile.certifications.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <Star className="mt-0.5 size-4 shrink-0 text-accent-500" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {[item.issuer, item.date ? formatDate(item.date) : '', item.credentialId].filter(Boolean).join(' · ')}
                  </p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block text-xs font-medium text-primary-600 hover:underline">
                      View credential
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
