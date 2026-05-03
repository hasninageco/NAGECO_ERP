# 17. API Documentation

## 17.1 Base URL and Service Health

- Default frontend API base URL: `http://10.0.2.2:5000`
- Backend listening port: `5000`
- Health endpoint: `GET /api/health`

## 17.2 Authentication and Authorization

- Public login endpoint: `POST /api/login`
- Login body:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

- Protected routes require header:

```http
Authorization: Bearer <jwt-token>
```

- Auth middleware responses:
- `401` -> Token required
- `403` -> Invalid or expired token

## 17.3 HR APIs

Base prefixes:
- `/positions`
- `/costCenters`
- `/employeeBanks`
- `/specialities`
- `/certificates`
- `/employees`
- `/children`
- `/Lleaves`
- `/holidays`
- `/wws`
- `/jsi`

Key endpoints:
- `/positions`: `GET /all`, `POST /Add`, `PUT /Update/:id_job`, `DELETE /Delete/:id_job`
- `/employees`: `GET /all`, `GET /ref/:Ref_emp`, `POST /Add`, `PUT /Update/:ID_EMP`, `DELETE /Delete/:ID_EMP`
- `/children`: `GET /all`, `GET /employee/:EMP_CHILD`, `POST /Add`, `PUT /Update/:ID_CHILD`, `DELETE /Delete/:ID_CHILD`
- `/Lleaves`: `GET /all`, `GET /by-employee/:id_emp`, `POST /Add`, `PUT /Update/:int_con`, `DELETE /Delete/:int_con`
- `/holidays`: `GET /all`, `GET /check-period`, `POST /Add`, `PUT /Update/:ID_HOLIDAYS`, `DELETE /Delete/:ID_HOLIDAYS`
- `/wws`: `GET /all`, `GET /check`, `POST /Add`, `PUT /Update/:int_can`, `DELETE /Delete/:int_can`
- `/jsi`: `GET /getsum_q`, `GET /getsum_pt`, `GET /getsum_b`, `GET /timesheets`, `POST /timesheets/bulk-update`

## 17.4 Finance APIs

Base prefixes:
- `/currencies`
- `/typeFond`
- `/coas`
- `/DsFinance`
- `/chashBookChecks`
- `/sarfEtrLoc`
- `/sarfCash`
- `/payments`

Key endpoints:
- `/currencies`: `GET /all`, `POST /Add`, `PUT /Update/:id_m3`, `DELETE /Delete/:id_m3`
- `/typeFond`: `GET /all`, `POST /Add`, `PUT /Update/:id_type_fond`, `DELETE /Delete/:id_type_fond`
- `/coas`: `GET /all`, `POST /Add`, `PUT /Update/:IND`, `DELETE /Delete/:IND`
- `/DsFinance`: `GET /all`, `GET /allR`, `GET /allBycrew`, `POST /Add`, `PUT /Update/:IND`, `DELETE /Delete/:IND`
- `/payments`: `GET /summary`, `GET /peek`

## 17.5 Supply Chain APIs

Base prefixes:
- `/products`
- `/sections`
- `/vendors`
- `/requisitions`
- `/bonentrer`
- `/bonsortie`
- `/upload`

Key endpoints:
- `/products`: `GET /all`, `POST /Add`, `PUT /Update/:Id_art`, `DELETE /Delete/:Id_art`
- `/sections`: `GET /all`, `POST /Add`, `PUT /Update/:ID_SECTION`, `DELETE /Delete/:ID_SECTION`
- `/vendors`: `GET /all`, `POST /Add`, `PUT /Update/:id_supplier_client`, `DELETE /Delete/:id_supplier_client`
- `/requisitions`: `GET /summary`, `GET /all`, `GET /:id`, `POST /add`, `PUT /update/:id`, `DELETE /delete/:id`
- `/bonentrer`: `GET /summary`, `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- `/bonsortie`: `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- `/upload`: `POST /files` (multipart upload)

## 17.6 Meeting and Booking APIs

Base prefixes:
- `/meetingSchedules`
- `/meetingRooms`

Key endpoints:
- `/meetingSchedules`: `GET /`, `GET /rooms`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/meetingRooms`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

## 17.7 Medical Insurance APIs

Base prefixes:
- `/medicalInsurance/services`
- `/medicalInsurance/providers`
- `/medicalInsurance/claims`
- `/medicalInsurance/claimLines`
- `/medicalInsurance/claimDocuments`
- `/medicalInsurance/balances`
- `/medicalInsurance/finance`

Key endpoints:
- `services`: `GET /all`, `POST /Add`, `PUT /Update/:ServiceId`, `DELETE /Delete/:ServiceId`
- `providers`: `GET /all`, `POST /Add`, `PUT /Update/:ProviderId`, `DELETE /Delete/:ProviderId`
- `claims`: `GET /all`, `GET /pending`, `POST /Add`, `POST /review/:ClaimId`, `PUT /Update/:ClaimId`, `DELETE /Delete/:ClaimId`
- `claimLines`: `GET /all`, `POST /Add`, `PUT /Update/:ClaimLineId`, `DELETE /Delete/:ClaimLineId`
- `claimDocuments`: `GET /all`, `GET /content`, `POST /Add`, `POST /Upload`, `PUT /Update/:DocId`, `DELETE /Delete`
- `balances`: periods CRUD + `GET /balance`, `POST /recharge`, `POST /recharge/bulk`, `POST /transfer`, `GET /statement`, `GET /transfers`, `GET /transactions`, `PUT /transactions/Update/:TxnId`, `DELETE /transactions/Delete/:TxnId`
- `finance`: `GET /approvedLines`, `POST /markPaid`

## 17.8 Fleet APIs

Base prefixes:
- `/fleet/vehicles`
- `/fleet/maintenance`
- `/fleet/trips`
- `/fleet/suppliers`
- `/fleet/insurance`
- `/fleet/documents`
- `/fleet/notifications`

Key endpoints:
- `vehicles`: `GET /`, `GET /summary/:id`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `maintenance`: `GET /`, `GET /overdue`, `GET /due`, `GET /:id`, `POST /`, `PUT /:id`, `POST /:id/start`, `POST /:id/complete`, `POST /:id/cancel`
- `trips`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/delete`, `POST /:id/approve`, `POST /:id/reject`, `POST /:id/start`, `POST /:id/complete`, `POST /:id/cancel`, `GET /:id/approvals`, `GET /:id/employees`, `POST /:id/employees`, `DELETE /:id/employees/:employeeId`, `GET /:id/visitors`, `POST /:id/visitors`, `DELETE /:id/visitors/:visitorId`
- `suppliers`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `insurance`: `GET /`, `GET /expiring`, `GET /expired`, `GET /vehicle/:idVehicle`, `GET /vehicle/:idVehicle/active`, `GET /:id`, `POST /`, `PUT /:id`, `POST /:id/renew`, `POST /:id/cancel`
- `documents`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `notifications`: `GET /`, `GET /unread`, `POST /generate`, `PATCH /:id/read`, `PATCH /:id/dismiss`, `GET /rules`, `POST /rules`, `PUT /rules/:id`, `DELETE /rules/:id`

## 17.9 File and Static Endpoints

- `GET /uploads/*` serves static uploaded files.
- Claims upload endpoint: `/medicalInsurance/claimDocuments/Upload`
- Supply chain upload endpoint: `/upload/files`

## 17.10 Notes

- Most master-data endpoints use a legacy naming pattern: `GET /all`, `POST /Add`, `PUT /Update/:id`, `DELETE /Delete/:id`.
- Some modules also expose REST-style endpoints (`/`, `/:id`) and action endpoints (`/:id/approve`, `/:id/complete`, etc.).
