import { useFieldArray, useForm, useFormContext, useWatch, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Briefcase, FolderGit2, GraduationCap, Medal, Plus, Star, Trash2 } from 'lucide-react';
import { useUpdateBasicsMutation, useUpdateRoleProfileMutation } from '../../../services/profileApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { COURSES, DEPARTMENTS } from '../../../constants/index.js';
import { profileEditSchema, PROFILE_FORM_DEFAULTS, cleanPayload } from './profileFormSchema.js';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';
import { Select } from '../../ui/Select.jsx';
import { Switch } from '../../ui/Switch.jsx';
import { Textarea } from '../../ui/Textarea.jsx';
import { TagInput } from '../../ui/TagInput.jsx';
import { IconButton } from '../../ui/IconButton.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card.jsx';

/* ---------------------------------------------------------------------------
 * Repeatable section editor — items rendered as JSX components (hook-safe)
 * ------------------------------------------------------------------------- */

function RepeatableSection({ name, title, icon: Icon, emptyItem, ItemEditor, addLabel }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <details className="group rounded-xl border border-slate-200 bg-white open:shadow-sm" open={fields.length > 0}>
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 text-primary-500" aria-hidden="true" />
          {title}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{fields.length}</span>
        </span>
        <span className="text-slate-400 group-open:hidden">Expand ▾</span>
      </summary>
      <div className="space-y-4 border-t border-slate-100 px-4 py-4">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex justify-end">
              <IconButton label={`Remove ${title.toLowerCase()} item`} variant="danger" size="sm" onClick={() => remove(index)}>
                <Trash2 />
              </IconButton>
            </div>
            <ItemEditor index={index} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => append(emptyItem)}>
          <Plus className="size-3.5" aria-hidden="true" /> {addLabel}
        </Button>
      </div>
    </details>
  );
}

function EducationItemEditor({ index }) {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Degree" placeholder="B.Tech Computer Science" required {...register(`education.${index}.degree`)} />
        <Input label="Institution" placeholder="College name" {...register(`education.${index}.institution`)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Field of study" {...register(`education.${index}.fieldOfStudy`)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start year" type="number" placeholder="2022" {...register(`education.${index}.startYear`)} />
          <Input label="End year" type="number" placeholder="2026" {...register(`education.${index}.endYear`)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Grade / CGPA" {...register(`education.${index}.grade`)} />
        <Input label="Description" {...register(`education.${index}.description`)} />
      </div>
    </div>
  );
}

function ExperienceItemEditor({ index }) {
  const { register, watch, setValue } = useFormContext();
  const current = watch(`experience.${index}.current`);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Company" placeholder="Company name" required {...register(`experience.${index}.company`)} />
        <Input label="Title" placeholder="SDE Intern" required {...register(`experience.${index}.title`)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start date" type="date" {...register(`experience.${index}.startDate`)} />
        <Input label="End date" type="date" disabled={current} {...register(`experience.${index}.endDate`)} />
      </div>
      <Switch
        label="I currently work here"
        checked={Boolean(current)}
        onChange={(value) => {
          setValue(`experience.${index}.current`, value);
          if (value) setValue(`experience.${index}.endDate`, '');
        }}
      />
      <Textarea label="Description" rows={2} placeholder="What did you work on?" {...register(`experience.${index}.description`)} />
    </div>
  );
}

function AchievementItemEditor({ index }) {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Achievement" placeholder="Hackathon winner" required {...register(`achievements.${index}.title`)} />
        <Input label="Date" type="date" {...register(`achievements.${index}.date`)} />
      </div>
      <Textarea label="Description" rows={2} {...register(`achievements.${index}.description`)} />
      <Input label="Link" placeholder="https://…" {...register(`achievements.${index}.link`)} />
    </div>
  );
}

function ProjectItemEditor({ index }) {
  const { register, control } = useFormContext();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Project title" placeholder="E-commerce platform" required {...register(`projects.${index}.title`)} />
        <Input label="Link" placeholder="https://github.com/…" {...register(`projects.${index}.link`)} />
      </div>
      <Textarea label="Description" rows={2} {...register(`projects.${index}.description`)} />
      <Controller
        name={`projects.${index}.techStack`}
        control={control}
        render={({ field }) => <TagInput label="Tech stack" value={field.value ?? []} onChange={field.onChange} placeholder="React, Node.js…" />}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start date" type="date" {...register(`projects.${index}.startDate`)} />
        <Input label="End date" type="date" {...register(`projects.${index}.endDate`)} />
      </div>
    </div>
  );
}

function CertificationItemEditor({ index }) {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Certification" placeholder="AWS Certified Developer" required {...register(`certifications.${index}.name`)} />
        <Input label="Issuer" placeholder="Amazon Web Services" {...register(`certifications.${index}.issuer`)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Date" type="date" {...register(`certifications.${index}.date`)} />
        <Input label="Credential ID" {...register(`certifications.${index}.credentialId`)} />
      </div>
      <Input label="Link" placeholder="https://…" {...register(`certifications.${index}.link`)} />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Main form
 * ------------------------------------------------------------------------- */

export function ProfileEditForm({ user, profile, onDone }) {
  const [updateBasics] = useUpdateBasicsMutation();
  const [updateRoleProfile] = useUpdateRoleProfileMutation();

  const role = user.role;
  const social =
    role === 'alumni'
      ? { linkedin: profile.linkedinUrl ?? '', github: profile.githubUrl ?? '', portfolio: profile.portfolioUrl ?? '' }
      : profile.socialLinks ?? {};

  const methods = useForm({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? '',
      // role fields
      rollNumber: profile.rollNumber ?? '',
      department: profile.department ?? '',
      course: profile.course ?? '',
      year: profile.year ?? '',
      graduationYear: profile.graduationYear ?? '',
      designation: profile.designation ?? '',
      subjects: profile.subjects ?? [],
      degree: profile.degree ?? '',
      currentCompany: profile.currentCompany ?? '',
      industry: profile.industry ?? '',
      mentorshipAreas: profile.mentorshipAreas ?? [],
      availableForMentorship: profile.availableForMentorship ?? false,
      // common
      about: profile.about ?? '',
      location: profile.location ?? '',
      skills: profile.skills ?? [],
      education: profile.education ?? [],
      experience: profile.experience ?? [],
      achievements: profile.achievements ?? [],
      projects: profile.projects ?? [],
      certifications: profile.certifications ?? [],
      socialLinks: { linkedin: social.linkedin ?? '', github: social.github ?? '', portfolio: social.portfolio ?? '' },
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = methods;
  const availableForMentorship = useWatch({ control: methods.control, name: 'availableForMentorship' });

  const onSubmit = async (values) => {
    const cleaned = cleanPayload(values);
    try {
      await Promise.all([
        updateBasics({ name: cleaned.name, phone: cleaned.phone }).unwrap(),
        updateRoleProfile(cleaned).unwrap(),
      ]);
      toast.success('Profile updated successfully');
      onDone?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save your profile.'));
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" required error={errors.name?.message} {...register('name')} />
              <Input label="Phone" type="tel" placeholder="+91 98765 43210" error={errors.phone?.message} {...register('phone')} />
            </div>
            <Textarea label="About" rows={4} placeholder="Tell the community about yourself…" {...register('about')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Location" placeholder="City, State" {...register('location')} />
              <Controller
                name="skills"
                control={control}
                render={({ field }) => <TagInput label="Skills" value={field.value ?? []} onChange={field.onChange} placeholder="JavaScript, DSA…" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Role-specific fields */}
        <Card>
          <CardHeader>
            <CardTitle>
              {role === 'student' ? 'Academic details' : role === 'faculty' ? 'Teaching details' : 'Professional details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {role === 'student' && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input label="Roll number" {...register('rollNumber')} />
                  <Select label="Department" placeholder="Select" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} {...register('department')} />
                  <Select label="Course" placeholder="Select" options={COURSES.map((c) => ({ value: c, label: c }))} {...register('course')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Year" placeholder="Year" options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: y, label: `Year ${y}` }))} {...register('year')} />
                  <Input label="Graduation year" type="number" {...register('graduationYear')} />
                </div>
              </>
            )}
            {role === 'faculty' && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input label="Employee ID" disabled value={profile.employeeId ?? ''} hint="Set at registration" />
                  <Select label="Department" placeholder="Select" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} {...register('department')} />
                  <Input label="Designation" placeholder="Assistant Professor" {...register('designation')} />
                </div>
                <Controller
                  name="subjects"
                  control={control}
                  render={({ field }) => <TagInput label="Subjects taught" value={field.value ?? []} onChange={field.onChange} placeholder="Data Structures…" />}
                />
              </>
            )}
            {role === 'alumni' && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input label="Graduation year" type="number" {...register('graduationYear')} />
                  <Select label="Department" placeholder="Select" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} {...register('department')} />
                  <Input label="Degree" placeholder="B.Tech Computer Science" {...register('degree')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Current company" placeholder="Google" {...register('currentCompany')} />
                  <Input label="Designation" placeholder="SDE-II" {...register('designation')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Industry" placeholder="Software / IT Services" {...register('industry')} />
                  <div className="flex items-end pb-1">
                    <Switch
                      label="Available for mentorship"
                      checked={availableForMentorship ?? false}
                      onChange={(value) => methods.setValue('availableForMentorship', value)}
                    />
                  </div>
                </div>
                <Controller
                  name="mentorshipAreas"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      label="Mentorship areas"
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="dsa, web_development, ai_ml, cloud, devops, career…"
                    />
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Social links */}
        <Card>
          <CardHeader>
            <CardTitle>Social links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Input label="LinkedIn" placeholder="https://linkedin.com/in/…" {...register('socialLinks.linkedin')} />
            <Input label="GitHub" placeholder="https://github.com/…" {...register('socialLinks.github')} />
            <Input label="Portfolio" placeholder="https://…" {...register('socialLinks.portfolio')} />
          </CardContent>
        </Card>

        {/* Experience & achievements sections */}
        <div className="space-y-4">
          <RepeatableSection
            name="education"
            title="Education"
            icon={GraduationCap}
            emptyItem={PROFILE_FORM_DEFAULTS.education}
            ItemEditor={EducationItemEditor}
            addLabel="Add education"
          />
          <RepeatableSection
            name="experience"
            title="Experience"
            icon={Briefcase}
            emptyItem={PROFILE_FORM_DEFAULTS.experience}
            ItemEditor={ExperienceItemEditor}
            addLabel="Add experience"
          />
          <RepeatableSection
            name="achievements"
            title="Achievements"
            icon={Medal}
            emptyItem={PROFILE_FORM_DEFAULTS.achievements}
            ItemEditor={AchievementItemEditor}
            addLabel="Add achievement"
          />
          <RepeatableSection
            name="projects"
            title="Projects"
            icon={FolderGit2}
            emptyItem={PROFILE_FORM_DEFAULTS.projects}
            ItemEditor={ProjectItemEditor}
            addLabel="Add project"
          />
          <RepeatableSection
            name="certifications"
            title="Certifications"
            icon={Star}
            emptyItem={PROFILE_FORM_DEFAULTS.certifications}
            ItemEditor={CertificationItemEditor}
            addLabel="Add certification"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onDone} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save profile
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
