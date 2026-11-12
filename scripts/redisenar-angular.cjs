const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const JSZip = require(require.resolve('jszip', {paths:[require.resolve('pptxgenjs')]}));
const root=path.resolve(__dirname,'..');
const file=path.join(root,'SmartDent_Presentacion_Avance_3.pptx');
const ppt=new PptxGenJS(); ppt.layout='LAYOUT_WIDE'; ppt.author='SmartDent';
const C={navy:'020F22',gold:'A57D00',cyan:'13D6E0',bg:'F6F8FC',ink:'031228',muted:'586D89',border:'DAE2EE',white:'FFFFFF',soft:'FFF6DB',red:'B42318',green:'167653'};
const rect=(s,x,y,w,h,fill=C.white,line=C.border,r=true)=>s.addShape(r?'roundRect':'rect',{x,y,w,h,rectRadius:.12,radius:.12,fill:{color:fill},line:{color:line,width:.8}});
const text=(s,t,x,y,w,h,size=16,color=C.ink,bold=false,extra={})=>s.addText(t,{x,y,w,h,fontFace:'Aptos',fontSize:size,color,bold,margin:0,breakLine:false,valign:'mid',...extra});
const arrow=(s,x,y,w=.4,h=0,color=C.gold)=>{const reverse=w<0;if(reverse){x+=w;w=-w;}s.addShape('line',{x,y,w,h,line:{color,width:1.8,beginArrowType:reverse?'triangle':'none',endArrowType:reverse?'none':'triangle'}});};
const label=(s,t,x,y,w=3)=>text(s,t,x,y,w,.24,10,C.gold,true,{charSpacing:1.2});
function code(s,title,lines,x,y,w,h){const compact=h<1.3;rect(s,x,y,w,h,C.navy,C.navy);text(s,title,x+.22,y+(compact?.09:.16),w-.44,.25,11,C.cyan,true);text(s,lines,x+.22,y+(compact?.43:.59),w-.44,h-(compact?.5:.77),compact?11:13,C.white,false,{fontFace:'Consolas',valign:'top',breakLine:false,paraSpaceAfterPt:0});}
function node(s,title,sub,x,y,w=2.7,h=1.0,accent=C.navy){rect(s,x,y,w,h);s.addShape('rect',{x,y,w:.05,h,fill:{color:accent},line:{color:accent}});text(s,title,x+.18,y+.15,w-.34,.30,16,C.navy,true);text(s,sub,x+.18,y+.51,w-.34,h-.58,11,C.muted);}
function footer(s,t){text(s,t,.75,6.72,11.8,.35,10.5,C.muted);}
function field(s,title,value,x,y,w=3.1,h=.57,color=C.border){text(s,title,x,y,w,.19,10,C.muted,true);rect(s,x,y+.26,w,h,C.white,color);text(s,value,x+.12,y+.30,w-.24,h-.06,12,C.ink);}
// 15: horizontal request path and a genuine short service example.
{
const s=ppt.addSlide();label(s,'DEL CLIC A LOS DATOS',.75,1.63);
const xs=[.75,3.86,6.97,10.08];const titles=['Componente','SmartDentApiService','Spring Boot','MariaDB'];
const subs=['Vista Standalone','HttpClient + DTO tipado','Controller → Service → JPA','Persistencia relacional'];
xs.forEach((x,i)=>{node(s,titles[i],subs[i],x,2.12,2.5,1.12,i%2?C.gold:C.navy);if(i<3)arrow(s,x+2.58,2.67,.42)});
text(s,'Solicitud HTTP / JSON →',4.2,1.82,4.7,.2,11,C.gold,true,{align:'center'});
arrow(s,10,3.55,-8.1,0,C.cyan);text(s,'← Respuesta tipada para actualizar la vista',3.5,3.65,6.3,.27,12,C.muted,false,{align:'center'});
code(s,'SMARTDENTAPISERVICE · MÉTODO REAL',"login(payload: LoginRequest): Observable<LoginResponse> {\n  return this.http.post<LoginResponse>(\n    '/api/auth/login', payload);\n}",.75,4.18,7.45,2.15);
label(s,'CONFIGURACIÓN ANGULAR 19',8.6,4.27,3.8);text(s,'withFetch() + jwtInterceptor\nBearer JWT en peticiones protegidas\nProxy /api → localhost:8080',8.6,4.72,3.9,1.12,14,C.navy,false,{breakLine:false});
footer(s,'Componentes: ng generate component nombre · Standalone con imports locales · Organización core / shared / features.');
}
// 16: a schematic responsive comparison, explicitly labelled rather than pretending to be screenshots.
{
const s=ppt.addSlide();label(s,'UN MISMO DISEÑO, DOS TAMAÑOS',.75,1.62,5);
rect(s,.8,2.05,7.15,3.75,C.white);rect(s,.8,2.05,7.15,.43,C.navy,C.navy,false);text(s,'SmartDent',1.05,2.15,2,.2,13,C.white,true);text(s,'Servicios    Mi agenda    Perfil',4.23,2.17,3.4,.16,9,C.white);
text(s,'Mi agenda',1.1,2.78,4,.4,23,C.navy,true);text(s,'Citas y seguimiento de tus tratamientos',1.1,3.29,5,.25,12,C.muted);
node(s,'Consulta dental','09:00 · Atención programada',1.1,3.91,3.05,1.17,C.gold);node(s,'Próximo control','Revisar indicaciones',4.42,3.91,3.05,1.17,C.cyan);
text(s,'ESCRITORIO · 1440 px',1.05,5.4,5,.2,10,C.gold,true);
rect(s,8.65,1.91,2.38,4.39,C.navy,C.navy);rect(s,8.78,2.12,2.12,3.97,C.bg,C.bg);text(s,'SmartDent       ≡',8.94,2.33,1.8,.24,12,C.navy,true);text(s,'Mi agenda',8.94,2.91,1.8,.35,20,C.navy,true);node(s,'Consulta dental','09:00 · Programada',8.93,3.53,1.82,.92,C.gold);node(s,'Próximo control','Ver indicaciones',8.93,4.65,1.82,.92,C.cyan);text(s,'MÓVIL · 375 px',11.26,3.2,1.4,.7,11,C.gold,true);
[['071426','navy'],['8A6D00','gold'],['F4D77D','gold-soft']].forEach(([c,t],i)=>{rect(s,.88+i*2.3,6.11,.3,.3,c,c,false);text(s,t,1.3+i*2.3,6.1,1.7,.3,12,C.navy,true)});
text(s,'Inter · jerarquía tipográfica\ngrid + breakpoints · estilos encapsulados',8.05,6.16,4.6,.46,11,C.muted);
footer(s,'Esquema ilustrativo basado en el diseño del proyecto · Tailwind CSS 3.4 · badges dinámicos según estado.');
}
// 17: routing tree with separate public, guest and protected branches.
{
const s=ppt.addSlide();node(s,'app.routes.ts','APP_ROUTES',.78,3.0,2.37,1.05);arrow(s,3.18,3.53,.57);
s.addShape('line',{x:3.8,y:2.15,w:0,h:3.2,line:{color:C.border,width:2}});
const branches=[['Rutas públicas','/ · /servicios · /contacto','loadComponent',2.0,C.cyan],['Solo visitantes','/login · /registro','guestGuard',3.3,C.gold],['Paneles protegidos','/paciente · /odontologo · /admin','authGuard + roleGuard',4.6,C.navy]];
branches.forEach(([a,b,c,y,accent])=>{arrow(s,3.8,y+.46,.48);node(s,a,b,4.45,y,4.15,1.04,accent);text(s,c,8.94,y+.26,3.6,.5,15,accent,true)});
code(s,'PARÁMETROS URL → INPUTS', 'provideRouter(APP_ROUTES,\n  withComponentInputBinding())',.8,5.96,6.6,.91);
text(s,'loadComponent: página bajo demanda\nloadChildren: rutas de cada rol',7.8,6.05,4.6,.66,13,C.muted);
footer(s,'El guard decide la navegación; Spring Security vuelve a verificar el permiso al recibir la petición.');
}
// 18: actual shared inputs, event pattern separated, shared store bus.
{
const s=ppt.addSlide();label(s,'DATOS Y EVENTOS',.75,1.64);
node(s,'Componente padre','Formulario / agenda / panel',.8,2.24,3.1,1.0);
node(s,'sd-field-error','input.required<AbstractControl | null>()',8.35,2.24,4.12,1.0,C.cyan);
arrow(s,4.13,2.53,3.96,0,C.cyan);text(s,'[control]="form.controls.dni"',4.1,2.08,4.05,.25,12,C.navy,true,{align:'center'});
arrow(s,8.09,3.56,-3.94,0,C.gold);text(s,'(evento) → acción en el padre',4.15,3.72,3.9,.26,12,C.gold,true,{align:'center'});
code(s,'INPUT REAL DEL PROYECTO', 'readonly control =\n  input.required<AbstractControl | null>();',.8,4.14,6.37,1.42);
text(s,'Patrón hijo → padre\noutput() / emit(valor)\nReferencia didáctica de eventos',7.6,4.2,4.75,1.1,14,C.muted);
rect(s,.8,5.91,11.68,.66,C.navy,C.navy);text(s,'ESTADO COMPARTIDO',1.04,6.1,2.55,.21,11,C.cyan,true);text(s,'AuthStore   ·   NotificationStore   ·   ToastStore',3.78,6.07,8.3,.29,16,C.white,true);
footer(s,'Signals: signal() / computed() · sd-status-badge recibe [status] · NotificationStore consulta novedades cada 8 s.');
}
// 19: simplified UI taken from actual field names and annotated with form bindings.
{
const s=ppt.addSlide();rect(s,.8,1.76,6.32,4.52);text(s,'Registrar atención clínica',1.08,2.04,5.6,.4,21,C.navy,true);rect(s,1.08,2.64,5.77,.46,C.soft,C.soft);text(s,'Tratamiento en curso · Sesión 2 de 3',1.24,2.75,5.39,.2,12,C.gold,true);
field(s,'Etapa del tratamiento','Tratamiento en curso',1.08,3.34,2.7);field(s,'Próximo control','Fecha para la siguiente sesión',4.12,3.34,2.7);
field(s,'Diagnóstico','Hallazgos de la atención',1.08,4.39,2.7);field(s,'Tratamiento realizado','Procedimiento de esta sesión',4.12,4.39,2.7);
rect(s,4.53,5.56,2.27,.43,C.navy,C.navy);text(s,'Guardar atención',4.68,5.66,1.97,.19,11,C.white,true,{align:'center'});
label(s,'CÓMO SE PROCESA',7.57,1.95,4.6);
[['01','Construir','ReactiveFormsModule +\nNonNullableFormBuilder'],['02','Enlazar','[formGroup]="historiaForm"\nformControlName="diagnostico"'],['03','Enviar','getRawValue() → DTO tipado\nguardarAtencion() → API']].forEach(([n,a,b],i)=>{const y=2.46+i*1.12;text(s,n,7.58,y,.5,.36,23,C.gold,true);text(s,a,8.28,y,3.98,.3,17,C.navy,true);text(s,b,8.28,y+.4,3.98,.54,12,C.muted)});
text(s,'Sesión 1  →  Sesión 2  →  Sesión 3  →  Alta',1.05,6.49,10.8,.28,16,C.navy,true,{align:'center'});
footer(s,'Vista simplificada de los campos reales de odontologo-agenda.component.ts · Historial y próximo control por tratamiento.');
}
// 20: visual correction example and the separate backend conflict sequence.
{
const s=ppt.addSlide();label(s,'1 / VALIDACIÓN EN EL CLIENTE',.8,1.66,6);
field(s,'DNI','12345',.82,2.17,3.21,.6,C.red);text(s,'Debe contener exactamente 8 números',.84,3.12,3.7,.49,12,C.red,true);arrow(s,4.38,2.84,1.0);
field(s,'DNI corregido','12345678',5.77,2.17,3.21,.6,C.green);text(s,'Formato válido',5.8,3.12,3.6,.27,13,C.green,true);
code(s,'VALIDADOR REAL', 'SmartDentValidators.dniPeru()\n/^\\d{8}$/',9.48,2.02,3.0,1.53);
label(s,'2 / CONFLICTO DETECTADO EN EL SERVIDOR',.8,4.00,8);
node(s,'Reservar cita','El horario ya está ocupado',.82,4.52,3.15,1.13);arrow(s,4.12,5.08,.63);
node(s,'HTTP 409','GlobalExceptionHandler',4.92,4.52,3.14,1.13,C.gold);arrow(s,8.23,5.08,.63);
node(s,'Mostrar el error','Cambiar horario y reintentar',9.02,4.52,3.46,1.13,C.red);
text(s,'400 · Entrada inválida       409 · Conflicto       422 · Regla de negocio',.9,6.01,11.6,.3,15,C.navy,true,{align:'center'});
text(s,'applyServerValidationErrors() asocia errores al formulario · sd-field-error presenta el mensaje',.9,6.43,11.6,.28,12,C.muted,false,{align:'center'});
footer(s,'Otros validadores: telefono · fechaLaborable · confirmarPassword · rangoHorario. Suites disponibles: Vitest y JUnit.');
}
async function main(){
const original=fs.readFileSync(file); const zip=await JSZip.loadAsync(original);
const generated=await JSZip.loadAsync(await ppt.write({outputType:'nodebuffer'}));
for(let i=1;i<=6;i++){
 const target=`ppt/slides/slide${i+14}.xml`;let old=await zip.file(target).async('string');
 const fresh=await generated.file(`ppt/slides/slide${i}.xml`).async('string');
 const body=fresh.match(/<p:spTree>([\s\S]*?)<\/p:spTree>/)[1].replace(/^.*?<\/p:grpSpPr>/,'');
 const header=old.match(/<p:spTree>([\s\S]*?)<\/p:spTree>/)[1];
 const group=header.match(/^[\s\S]*?<\/p:grpSpPr>/)[0];
 const kept=[...header.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map(m=>m[0]).filter(sp=>{const off=sp.match(/<a:off[^>]*y="(\d+)"/);return off&&Number(off[1])<1.4*914400;}).join('');
 let next=1;let content=group+kept+body;content=content.replace(/(<p:cNvPr\b[^>]*\bid=")\d+("[^>]*>)/g,(_,a,b)=>a+(next++)+b);
 old=old.replace(/<p:spTree>[\s\S]*?<\/p:spTree>/,`<p:spTree>${content}</p:spTree>`);
 zip.file(target,old);
}
const backup=file.replace('.pptx','_antes_redisenar_angular.pptx');if(!fs.existsSync(backup))fs.writeFileSync(backup,original);
fs.writeFileSync(process.env.SMARTDENT_PPT_OUTPUT || file,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
console.log('Actualizadas únicamente las diapositivas 15–20. Resto de diapositivas conservado.');
}
main().catch(e=>{console.error(e);process.exit(1)});
