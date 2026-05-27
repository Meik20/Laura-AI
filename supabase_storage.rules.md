# Supabase Storage RLS (Row Level Security) Policies

To protect your Supabase Storage buckets, configure the following RLS rules on the Supabase Dashboard under **Database > Writing Policies** or **Storage > Policies**.

These policies ensure that:
1. Academic resources (PDFs, templates) in the `public-resources` bucket can be read by anyone, but created/updated only by **tutors**, **teachers**, or **admins**.
2. Private user documents (assignment submissions, user avatars) in the `user-documents` bucket can only be read or written by the authenticated owner of the files.

---

## 1. Bucket: `public-resources`

### Policy 1: Allow public read access to all users (authenticated and anonymous)
- **Allowed Operation**: `SELECT`
- **Target Role**: `public`
- **Policy Definition (USING)**:
```sql
true
```

### Policy 2: Allow inserts only for Tutors, Teachers, and Admins
- **Allowed Operation**: `INSERT`
- **Target Role**: `authenticated`
- **Policy Definition (WITH CHECK)**:
```sql
(
  -- Check user role from metadata or from your profile table
  -- Assuming you query the public.users profile table:
  exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role in ('tutor', 'teacher', 'admin')
  )
)
```

---

## 2. Bucket: `user-documents`

### Policy 1: Allow users to manage their own folder
- **Allowed Operation**: `ALL` (SELECT, INSERT, UPDATE, DELETE)
- **Target Role**: `authenticated`
- **Policy Definition (USING / WITH CHECK)**:
Matches the user's UID to the folder name path (`/user-documents/{uid}/*`).
```sql
(role() = 'authenticated') AND 
(auth.uid()::text = (storage.foldername(name))[1])
```

---

## 3. SQL Direct Script (Run in Supabase SQL Editor)

```sql
-- Enable Row Level Security on Storage
alter table storage.objects enable row level security;

-- Policy for Public Resources (SELECT)
create policy "Public Resources Read Access"
on storage.objects for select
to public
using ( bucket_id = 'public-resources' );

-- Policy for Public Resources (INSERT/UPDATE/DELETE)
create policy "Tutor Resource Management"
on storage.objects for all
to authenticated
using (
  bucket_id = 'public-resources' 
  and exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role in ('tutor', 'teacher', 'admin')
  )
)
with check (
  bucket_id = 'public-resources'
  and exists (
    select 1 from public.users 
    where id = auth.uid() 
    and role in ('tutor', 'teacher', 'admin')
  )
);

-- Policy for User Documents (Owner Isolation)
create policy "User Document Owner Isolation"
on storage.objects for all
to authenticated
using (
  bucket_id = 'user-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'user-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```
