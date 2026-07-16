# LGPD readiness checklist

This document records technical privacy controls and operational work still required. It is not a legal opinion or a certification of compliance.

## Implemented technical controls

- Password hashes and access tokens are removed from every user API response.
- Public signup always creates a `basic` account; clients cannot self-assign privileged roles.
- Basic users can only retrieve their own profile. Supervisor/admin access remains role-controlled.
- Passwords are hashed with bcrypt and authentication uses expiring JWTs.
- Login queries use `$eq` and reject non-string email values to reduce query-selector injection.
- Protected routes require authentication and role-based authorization.
- Unexpected server errors return a generic message rather than internal or database details.
- Requests are rate limited and security-oriented HTTP headers are applied.
- Upload types and sizes are restricted.
- Automated unit, API integration, system, security, coverage, and production smoke tests run in CI/CD.

## Organizational work the controller must complete

- Identify the controller, operators (for example MongoDB and Vercel), and the privacy contact or encarregado where required.
- Document a lawful basis and specific purpose for every collected field. Remove CPF, RG, birth date, address, or phone fields that are not necessary for the stated purpose.
- Publish a Portuguese privacy notice describing purposes, sharing, retention, security, international transfers, and how data subjects exercise their rights.
- Define authenticated procedures and response records for access, correction, portability, information, objection, anonymization, and deletion requests.
- Define retention periods and a deletion/anonymization job. Do not promise immediate deletion where another law requires retention; document the applicable rule.
- Maintain a data inventory, access review, processor contracts, backup policy, vulnerability/patch process, and staff confidentiality process.
- Create and rehearse an incident-response plan, including assessment and notification to affected data subjects and the ANPD when legally required.
- Assess international data transfers and cloud-processing terms.
- Prepare a data-protection impact report when the processing risk or ANPD requirements make one appropriate.
- Have Brazilian privacy counsel review the actual NGO operations, notices, lawful bases, contracts, and retention rules before launch.

## Official references

- [Lei nº 13.709/2018 (LGPD)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm)
- [ANPD security guide for small processing agents](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-guia-de-seguranca-para-agentes-de-tratamento-de-pequeno-porte)
- [ANPD guidance on controllers, operators, and privacy officers](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado)
- [ANPD information for data subjects](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1)
