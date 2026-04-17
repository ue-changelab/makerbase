CREATE TABLE user_certifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  cert_id     UUID NOT NULL REFERENCES certifications(id),
  issued_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at  DATE,
  issued_by   UUID NOT NULL REFERENCES users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, cert_id)
);

CREATE INDEX idx_user_certs_user   ON user_certifications(user_id);
CREATE INDEX idx_user_certs_expiry ON user_certifications(expires_at) WHERE expires_at IS NOT NULL;