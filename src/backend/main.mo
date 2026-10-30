import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mixins/authorization-api";
import Expose "mo:caffeineai-oql/Expose";
import OQL "mo:caffeineai-oql";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import Principal "mo:core/Principal";

import AppointmentStatusValue "AppointmentStatusValue";
import LanguageValue "LanguageValue";
import AuditActionValue "AuditActionValue";

import AppointmentTypes "types/appointment";
import CommonTypes "types/common";

import CustomerLib "lib/customer";
import AppointmentLib "lib/appointment";
import AdminLib "lib/admin";

import CustomerApi "mixins/customer-api";
import AppointmentApi "mixins/appointment-api";
import AdminApi "mixins/admin-api";
import PublicApi "mixins/public-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let customers : CustomerLib.State;
  let appointments : AppointmentLib.State;
  let admin : AdminLib.State;

  transient let anyPrincipal = Principal.fromText("aaaaa-aa");

  // Bind the variant-to-row helpers to local names so the OQL payload
  // closures call them directly. Calling `Module._toRow(x)` inline trips the
  // M0236 lint, whose auto-fix wrongly rewrites it to a method call.
  transient let appointmentStatusToRow = AppointmentStatusValue._toRow;
  transient let languageToRow = LanguageValue._toRow;
  transient let auditActionToRow = AuditActionValue._toRow;

  include MixinAuthorization(accessControlState, null);
  include CustomerApi(customers, admin);
  include AppointmentApi(appointments, customers, admin);
  include AdminApi(accessControlState, admin, appointments, customers);
  include PublicApi(appointments);
  include ApiDocMixin();
  include Expose({
    entities = [
      appointments.services.toEntityManual("service", "Service", "id")
        .sample({
          id = 0;
          code = "";
          nameEn = "";
          nameAr = "";
          nameKu = "";
          descriptionEn = "";
          descriptionAr = "";
          descriptionKu = "";
          requiredDocumentsEn = [] : [Text];
          requiredDocumentsAr = [] : [Text];
          requiredDocumentsKu = [] : [Text];
          fee = 0;
          var active = true;
        })
        .payload("id", func s = s.id)
        .payload("code", func s = s.code)
        .payload("nameEn", func s = s.nameEn)
        .payload("nameAr", func s = s.nameAr)
        .payload("nameKu", func s = s.nameKu)
        .payload("descriptionEn", func s = s.descriptionEn)
        .payload("descriptionAr", func s = s.descriptionAr)
        .payload("descriptionKu", func s = s.descriptionKu)
        .payload("requiredDocumentsEn", func s = s.requiredDocumentsEn.values().join(" | "))
        .payload("requiredDocumentsAr", func s = s.requiredDocumentsAr.values().join(" | "))
        .payload("requiredDocumentsKu", func s = s.requiredDocumentsKu.values().join(" | "))
        .payload("fee", func s = s.fee)
        .payload("active", func s = s.active)
        .public_()
        .build(),
      appointments.branches.toEntity("branch", "Branch", "id")
        .sample({
          id = 0;
          code = "";
          nameEn = "";
          nameAr = "";
          nameKu = "";
          addressEn = "";
          addressAr = "";
          addressKu = "";
          phone = "";
          var active = true;
        })
        .public_()
        .build(),
      appointments.appointments.toEntityManual("appointment", "Appointment", "id")
        .sample({
          id = 0;
          reference = "";
          customerId = 0;
          serviceId = 0;
          branchId = 0;
          date = "";
          slot = "";
          var status : AppointmentTypes.AppointmentStatus = #requested;
          var notes = "";
          var qrToken = "";
          var checkedInAt = ?0;
          var createdAt = 0;
          var updatedAt = 0;
        })
        .payload("id", func a = a.id)
        .payload("reference", func a = a.reference)
        .payload("customerId", func a = a.customerId)
        .payload("serviceId", func a = a.serviceId)
        .payload("branchId", func a = a.branchId)
        .payload("date", func a = a.date)
        .payload("slot", func a = a.slot)
        .payload("status", func a = appointmentStatusToRow(a.status), func (v : OQL.Value) : OQL.Value = v)
        .payload("notes", func a = a.notes)
        .payload("checkedInAt", func a = switch (a.checkedInAt) { case (?t) t; case null 0 })
        .payload("createdAt", func a = a.createdAt)
        .payload("updatedAt", func a = a.updatedAt)
        .hidden("qrToken")
        .controllerOnly()
        .build(),
      customers.customers.toEntityManual("customer", "Customer", "id")
        .sample({
          id = 0;
          principal = anyPrincipal;
          var fullName = "";
          phone = "";
          nationalId = "";
          var email = ?"";
          var language : CommonTypes.Language = #en;
          var verified = false;
          var createdAt = 0;
          var updatedAt = 0;
        })
        .payload("id", func c = c.id)
        .payload("principal", func c = c.principal)
        .payload("fullName", func c = c.fullName)
        .payload("phone", func c = c.phone)
        .payload("email", func c = switch (c.email) { case (?e) e; case null "" })
        .payload("language", func c = languageToRow(c.language), func (v : OQL.Value) : OQL.Value = v)
        .payload("verified", func c = c.verified)
        .payload("createdAt", func c = c.createdAt)
        .payload("updatedAt", func c = c.updatedAt)
        .hidden("nationalId")
        .controllerOnly()
        .build(),
      admin.auditLog.toEntityManual("auditEntry", "AuditEntry", "id")
        .sample({
          id = 0;
          actorPrincipal = anyPrincipal;
          action = #signIn;
          subject = "";
          detail = "";
          var createdAt = 0;
        })
        .payload("id", func e = e.id)
        .payload("actorPrincipal", func e = e.actorPrincipal)
        .payload("action", func e = auditActionToRow(e.action), func (v : OQL.Value) : OQL.Value = v)
        .payload("subject", func e = e.subject)
        .payload("detail", func e = e.detail)
        .payload("createdAt", func e = e.createdAt)
        .controllerOnly()
        .build(),
    ];
  });
};
