
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_prefix text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('auxiliar','producao')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.equipment_types TO authenticated;
GRANT ALL ON public.equipment_types TO service_role;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "types readable" ON public.equipment_types FOR SELECT TO authenticated USING (true);

INSERT INTO public.equipment_types (code_prefix, name, icon, category, sort_order) VALUES
  ('CA','Comboio','comboio','auxiliar',1),
  ('CP','Caminhão Pipa','pipa','auxiliar',2),
  ('MN','Motoniveladora','motoniveladora','auxiliar',3),
  ('PC','Pá Carregadeira','pa-carregadeira','auxiliar',4),
  ('RC','Rolo Compactador','rolo','auxiliar',5),
  ('RP','Rompedor','rompedor','auxiliar',6),
  ('RT','Retroescavadeira','retroescavadeira','auxiliar',7),
  ('TE','Trator','trator','auxiliar',8),
  ('EH','Escavadeira','escavadeira','producao',9),
  ('CB','Caminhão Basculante','caminhao','producao',10);

CREATE TABLE public.equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  type_id uuid NOT NULL REFERENCES public.equipment_types(id),
  active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipments TO authenticated;
GRANT ALL ON public.equipments TO service_role;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own equipments" ON public.equipments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.shift_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT current_date,
  shift smallint NOT NULL DEFAULT 1 CHECK (shift IN (1,2)),
  show_parking boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_reports TO authenticated;
GRANT ALL ON public.shift_reports TO service_role;
ALTER TABLE public.shift_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports" ON public.shift_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.shift_report_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.shift_reports(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES public.equipments(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  type_prefix text NOT NULL,
  category text NOT NULL DEFAULT 'auxiliar',
  situation text NOT NULL DEFAULT 'DISPONIVEL' CHECK (situation IN ('OPERANDO','DISPONIVEL','MANUTENCAO','INDISPONIVEL')),
  operation_front text NOT NULL DEFAULT '',
  parking_front text NOT NULL DEFAULT '',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_report_equipment TO authenticated;
GRANT ALL ON public.shift_report_equipment TO service_role;
ALTER TABLE public.shift_report_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own report lines" ON public.shift_report_equipment FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sre_report ON public.shift_report_equipment(report_id);
CREATE INDEX idx_equipments_user ON public.equipments(user_id);
CREATE INDEX idx_reports_user ON public.shift_reports(user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_equipments_upd BEFORE UPDATE ON public.equipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_reports_upd BEFORE UPDATE ON public.shift_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_sre_upd BEFORE UPDATE ON public.shift_report_equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.seed_default_equipments()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  inserted integer := 0;
  rec record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.profiles (id, name) VALUES (uid, '') ON CONFLICT (id) DO NOTHING;
  IF EXISTS (SELECT 1 FROM public.equipments WHERE user_id = uid) THEN RETURN 0; END IF;
  FOR rec IN
    SELECT * FROM (VALUES
      ('CA-0002','Comboio',1),('CP-0006','Pipa',2),('CP-0007','Pipa',3),
      ('MN-0001','Motoniveladora',4),('MN-0003','Motoniveladora',5),
      ('PC-0201','Pá Carregadeira',6),('PC-0203','Pá Carregadeira',7),('PC-0204','Pá Carregadeira',8),
      ('PC-0205','Pá Carregadeira',9),('PC-0206','Pá Carregadeira',10),
      ('RC-0001','Rolo Compactador',11),('RP-0002','Rompedor',12),('RT-0004','Retroescavadeira',13),
      ('TE-0101','Trator',14),('TE-0102','Trator',15),
      ('EH-0001','Escavadeira',16),('EH-0004','Escavadeira',17),('EH-0005','Escavadeira',18),('EH-0008','Escavadeira',19),
      ('CB-0121','Caminhão Báscula',20),('CB-1049','Caminhão Báscula',21),('CB-1050','Caminhão Báscula',22),
      ('CB-1051','Caminhão Báscula',23),('CB-1052','Caminhão Báscula',24),('CB-1073','Caminhão Báscula',25),
      ('CB-1083','Caminhão Báscula',26),('CB-1102','Caminhão Báscula',27),('CB-1103','Caminhão Báscula',28),
      ('CB-1122','Caminhão Báscula',29),('CB-1129','Caminhão Báscula',30),('CB-1138','Caminhão Báscula',31),
      ('CB-2006','Caminhão Báscula',32)
    ) AS t(code, name, ord)
  LOOP
    INSERT INTO public.equipments (user_id, code, name, type_id, display_order)
    SELECT uid, rec.code, rec.name, et.id, rec.ord
    FROM public.equipment_types et WHERE et.code_prefix = split_part(rec.code,'-',1)
    ON CONFLICT (user_id, code) DO NOTHING;
    inserted := inserted + 1;
  END LOOP;
  RETURN inserted;
END; $$;

GRANT EXECUTE ON FUNCTION public.seed_default_equipments() TO authenticated;
