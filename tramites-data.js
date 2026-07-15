// Lista de trámites legales y administrativos pendientes para la compra
// del terreno y el inicio de los servicios de la casa.
// status debe ser una de: 'pendiente', 'en-proceso', 'hecho'
// Actualiza este archivo cada vez que se resuelva un paso.

const TRAMITES = [
  {
    section: 'Escritura y registro del terreno',
    items: [
      {
        title: 'Firma de mamá en el contrato de compraventa',
        status: 'pendiente',
        notes:
          'La copia del contrato de compraventa (18 de febrero de 2025, Lote 15, Manzana 3) todavía tiene en blanco la línea de firma e INE de la compradora (Ana María). Hay que firmarlo antes de avanzar con cualquier registro público o con la solicitud de agua, porque el CEA pide que la documentación esté a nombre de quien es dueño del predio.',
      },
      {
        title: 'Verificar el registro catastral del predio',
        status: 'pendiente',
        notes:
          'El Lote 15 todavía no aparece registrado por separado en el sistema catastral — sigue bajo el Certificado Parcelario No. 000000030874 (Parcela 82 Z-1 P1/2, Ejido La D). Confirmar con el vendedor o con Catastro municipal si falta subdividir/registrar el lote a nombre de mamá.',
      },
    ],
  },
  {
    section: 'Agua — Comisión Estatal de Agua / Municipio de Pedro Escobedo',
    items: [
      {
        title: 'Reunir los documentos para la solicitud de contrato de agua',
        status: 'pendiente',
        notes:
          'Se necesitan copias de: 1) comprobante de propiedad o posesión (escritura de no más de 6 meses, o constancia de posesión sellada), 2) croquis de localización de Google Maps marcando el predio, 3) plano simple con medidas de lo construido o por construir, 4) permiso para abrir zanja (se pide en Desarrollo Urbano o con el Sub-delegado), 5) credencial de elector, 6) recibo de agua de un vecino, 7) una foto de frente y una de la construcción del predio.',
      },
      {
        title: 'Decidir la forma de pago de la instalación',
        status: 'pendiente',
        notes:
          'Costo estimado por la Comisión Estatal de Agua: entre $14,500 y $16,500 MXN (el costo final depende de la inspección del predio). Se puede pagar de una sola vez, o a pagos dentro del recibo de agua — para pagos se necesita un anticipo del 30%.',
      },
      {
        title: 'Presentar la solicitud en la oficina',
        status: 'pendiente',
        notes:
          'Oficina: Av. Rebeca s/n, Col. Centro, C.P. 76750, Pedro Escobedo, Qro. Tel. 448 27 50717 o 448 27 50173 ext. 107. Si alguien más que el titular de la toma va a hacer el trámite, se necesita Carta Poder simple con 2 testigos, más copia de INE del que otorga, del que acepta y de los testigos.',
      },
    ],
  },
  {
    section: 'Luz — Comisión Federal de Electricidad (CFE)',
    items: [
      {
        title: 'Verificar que la instalación eléctrica interna esté lista',
        status: 'pendiente',
        notes:
          'La CFE requiere que la instalación interna esté completamente terminada antes de solicitar el servicio: acometida al límite de la propiedad, base para el medidor lista, y no más de 5 metros entre el medidor y el interruptor principal.',
      },
      {
        title: 'Confirmar la distancia al poste más cercano',
        status: 'pendiente',
        notes:
          'Debe haber un poste de CFE a no más de 35 metros de la vivienda (zona urbana) o 50 metros (zona rural, poblaciones de menos de 50,000 habitantes). Si no se cumple, hay que presentar una Solicitud de Factibilidad — la CFE responde en 15 días hábiles con la solución técnica y su costo.',
      },
      {
        title: 'Reunir los documentos para el contrato',
        status: 'pendiente',
        notes:
          'Identificación oficial, RFC, dirección completa del servicio (calle, número, colonia, municipio, estado, código postal y entrecalles), teléfono y correo electrónico. Si lo tramita alguien distinto al titular, se necesita carta poder simple o notariada más las identificaciones de ambos.',
      },
      {
        title: 'Hacer la solicitud de nuevo contrato',
        status: 'pendiente',
        notes:
          'Se puede hacer en línea en cfe.mx, por teléfono al 071, o en una oficina de CFE. El contrato en sí es gratis — en el primer recibo se cobra un Depósito de Garantía (equivalente a un mes de consumo en la zona, se cobra una sola vez). La CFE atiende la solicitud en 2 días en zona urbana o 5 días en zona rural.',
      },
    ],
  },
];
