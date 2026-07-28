-- Reativação de pacientes: avisar sobre quem não volta há um tempo.
-- Na estética a maior parte da receita vem de retorno (botox a cada 4–6
-- meses, limpeza mensal, pacote que acabou), então esse é o alerta de
-- maior valor do painel.

-- Quantos dias sem voltar até o paciente entrar na lista de reativação.
alter table public.clinics
  add column if not exists inactive_patient_days integer not null default 90;

-- Última visita e próximo agendamento de cada paciente. Subconsultas em
-- vez de joins para não multiplicar linhas entre agenda e sessões.
--
-- security_invoker: a view roda com as permissões de quem consulta, então
-- o RLS das tabelas de origem continua valendo e uma clínica nunca
-- enxerga paciente de outra.
create or replace view public.patient_activity
with (security_invoker = on) as
select
  p.id         as patient_id,
  p.clinic_id,
  p.created_at,
  (
    select max(a.appointment_date)
    from public.appointments a
    where a.patient_id = p.id
      and a.appointment_date <= current_date
      and a.status not in ('canceled_by_patient', 'canceled_by_clinic', 'no_show')
  ) as last_appointment,
  (
    select max(s.session_date)
    from public.sessions s
    where s.patient_id = p.id
      and s.session_date <= current_date
      and s.status = 'done'
  ) as last_session,
  -- Quem já tem horário marcado não precisa ser reativado.
  (
    select min(a.appointment_date)
    from public.appointments a
    where a.patient_id = p.id
      and a.appointment_date > current_date
      and a.status not in ('canceled_by_patient', 'canceled_by_clinic')
  ) as next_appointment
from public.patients p;

create index if not exists appointments_patient_date_idx
  on public.appointments(patient_id, appointment_date);

create index if not exists sessions_patient_date_idx
  on public.sessions(patient_id, session_date);
