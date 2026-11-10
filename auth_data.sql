--
-- PostgreSQL database dump
--

\restrict 70Ykzwg1bY395xqfUMoaQA1pt88aoWuYuCOMrAQPbamhKgU05HuxPypvDYwpcwm

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	eaedc76a-b5e4-4575-8d6b-1cdda4bbfc59	authenticated	authenticated	administrativo@demo.pnf	$2a$10$prKVOTIr6SxK8Vfw0nDgzuhyWbDXfB8EhaeBxhtkwX5hjh2b44vFS	2026-10-29 20:06:03.71026+00	\N		\N		2026-11-04 14:35:08.311122+00			\N	2026-11-06 22:32:14.257515+00	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true, "nombre_completo": "Luis Fernando Aguirre Campos"}	\N	2026-10-29 20:06:03.708318+00	2026-11-06 22:32:14.259919+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	43427fa6-d8c4-4844-8b3e-2548a1d056cf	authenticated	authenticated	supervisor@demo.pnf	$2a$10$v7WqBtYzj48Z2iBUI5vOrOqdRhepvIo1XsfK7730m7jCaW.vu2A7G	2026-10-29 20:06:03.77594+00	\N		\N		2026-11-04 19:23:03.69534+00			\N	2026-11-04 19:23:03.736417+00	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true, "nombre_completo": "Arq. Claudia Estrada Navarro"}	\N	2026-10-29 20:06:03.773912+00	2026-11-04 19:23:03.738093+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	e883edc6-b7c6-4fae-b974-7fffd2bd7468	authenticated	authenticated	director@demo.pnf	$2a$10$UU.8dp4L2I.DUJeaGl0vquWPUE.qhSS6pho66sG1DMDvd8zXFqckS	2026-10-29 20:06:03.432295+00	\N		\N		\N			\N	2026-11-09 20:27:45.656741+00	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true, "nombre_completo": "Ricardo Naranja Salazar"}	\N	2026-10-29 20:06:03.427355+00	2026-11-09 21:26:13.983553+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4ba2210e-20c4-4771-bdfd-589ff29e1603	authenticated	authenticated	auxiliar@demo.pnf	$2a$10$dXwplB1n6sq/pslYZX/bw.f/4QZNL5GDiFCPyMUzw.O5x0zPYALNu	2026-10-29 20:06:03.643209+00	\N		\N		\N			\N	2026-11-06 23:49:22.662285+00	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true, "nombre_completo": "Paola Guadalupe Serrano León"}	\N	2026-10-29 20:06:03.64101+00	2026-11-06 23:49:22.669706+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ad912749-5ac2-4c12-8d9b-44520d67af00	authenticated	authenticated	residente2@demo.pnf	$2a$10$7fJosmT4IAWi/KooknoNv.OHIm6GEDcalT4Y1Qg/Jehv/SEQGjO3a	2026-10-29 20:06:03.575307+00	\N		\N		2026-11-04 20:46:38.733501+00			\N	2026-11-06 23:49:22.64961+00	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true, "nombre_completo": "Ing. Jorge Luis Mendoza Ríos"}	\N	2026-10-29 20:06:03.572906+00	2026-11-06 23:49:22.670005+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	cb865aa9-69e6-47dc-bae5-3cfa43eedfa8	authenticated	authenticated	residente@demo.pnf	$2a$10$ufgTe/jrs9XlfhEULI7GDe54DHYduvJC0/7rWZyMyKdfPev4zf4ZK	2026-10-29 20:06:03.509502+00	\N		\N		\N			\N	2026-11-06 23:49:22.69561+00	{"provider": "email", "providers": ["email"]}	{"demo": true, "email_verified": true, "nombre_completo": "Ing. Mariana Torres Villalobos"}	\N	2026-10-29 20:06:03.506534+00	2026-11-06 23:49:22.708436+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
e883edc6-b7c6-4fae-b974-7fffd2bd7468	e883edc6-b7c6-4fae-b974-7fffd2bd7468	{"sub": "e883edc6-b7c6-4fae-b974-7fffd2bd7468", "email": "director@demo.pnf", "email_verified": false, "phone_verified": false}	email	2026-10-29 20:06:03.429762+00	2026-10-29 20:06:03.429793+00	2026-10-29 20:06:03.429793+00	ee5ddde2-b45b-4e46-8745-a044940cef10
cb865aa9-69e6-47dc-bae5-3cfa43eedfa8	cb865aa9-69e6-47dc-bae5-3cfa43eedfa8	{"sub": "cb865aa9-69e6-47dc-bae5-3cfa43eedfa8", "email": "residente@demo.pnf", "email_verified": false, "phone_verified": false}	email	2026-10-29 20:06:03.507739+00	2026-10-29 20:06:03.50777+00	2026-10-29 20:06:03.50777+00	6e24db09-f358-42ee-bd11-1d3ff5efd658
ad912749-5ac2-4c12-8d9b-44520d67af00	ad912749-5ac2-4c12-8d9b-44520d67af00	{"sub": "ad912749-5ac2-4c12-8d9b-44520d67af00", "email": "residente2@demo.pnf", "email_verified": false, "phone_verified": false}	email	2026-10-29 20:06:03.573846+00	2026-10-29 20:06:03.573866+00	2026-10-29 20:06:03.573866+00	cfdcc1c2-74dd-439a-a24d-5fe99d29b434
4ba2210e-20c4-4771-bdfd-589ff29e1603	4ba2210e-20c4-4771-bdfd-589ff29e1603	{"sub": "4ba2210e-20c4-4771-bdfd-589ff29e1603", "email": "auxiliar@demo.pnf", "email_verified": false, "phone_verified": false}	email	2026-10-29 20:06:03.64192+00	2026-10-29 20:06:03.641944+00	2026-10-29 20:06:03.641944+00	0f303625-1bee-4f3d-ba33-d29165bbb20a
eaedc76a-b5e4-4575-8d6b-1cdda4bbfc59	eaedc76a-b5e4-4575-8d6b-1cdda4bbfc59	{"sub": "eaedc76a-b5e4-4575-8d6b-1cdda4bbfc59", "email": "administrativo@demo.pnf", "email_verified": false, "phone_verified": false}	email	2026-10-29 20:06:03.709148+00	2026-10-29 20:06:03.709169+00	2026-10-29 20:06:03.709169+00	aadfe359-1051-4453-bbd0-08390f365f09
43427fa6-d8c4-4844-8b3e-2548a1d056cf	43427fa6-d8c4-4844-8b3e-2548a1d056cf	{"sub": "43427fa6-d8c4-4844-8b3e-2548a1d056cf", "email": "supervisor@demo.pnf", "email_verified": false, "phone_verified": false}	email	2026-10-29 20:06:03.774815+00	2026-10-29 20:06:03.774836+00	2026-10-29 20:06:03.774836+00	b25ad63b-29d3-43fd-a2af-50ad0d29c0f2
\.


--
-- PostgreSQL database dump complete
--

\unrestrict 70Ykzwg1bY395xqfUMoaQA1pt88aoWuYuCOMrAQPbamhKgU05HuxPypvDYwpcwm

