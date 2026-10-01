fpath = r"c:\Users\kelvi\Documents\utp\7mo ciclo\Desarrollo web integrado\proyecto final\maquetacion-html\js\admin.js"

with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()

# find where "closeAdminModal(\"#service-modal\");" is and replace from there to "function renderFinance"
target_start = "      closeAdminModal(\"#service-modal\");\n      render();\n    } catch (error) {"
target_end = "function renderFinance(appointments, finance) {"

idx1 = content.find(target_start)
idx2 = content.find(target_end)

if idx1 != -1 and idx2 != -1:
    replacement = """      closeAdminModal("#service-modal");
      render();
    } catch (error) {
      if (formError) {
        formError.textContent = error.message || "Error al procesar el servicio.";
        formError.classList.remove("hidden");
      } else {
        window.alert(error.message);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isCreate ? "Crear servicio" : "Guardar cambios";
    }
  });
}

function renderAdminCharts(appointments) {
  const statuses = [
    { key: "PENDIENTE", label: "Pendientes", color: "#d97706" },
    { key: "CONFIRMADA", label: "Confirmadas", color: "#2563eb" },
    { key: "ATENDIDA", label: "Atendidas", color: "#15803d" },
    { key: "CANCELADA", label: "Canceladas", color: "#dc2626" }
  ].map((item) => ({ ...item, count: appointments.filter((appointment) => appointment.status === item.key).length }));
  const total = statuses.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const segments = statuses.map((item) => {
    const start = cursor;
    cursor += total ? (item.count / total) * 100 : 0;
    return `${item.color} ${start}% ${cursor}%`;
  });
  document.querySelector("#status-donut").style.background = total ? `conic-gradient(${segments.join(",")})` : "#e2e8f0";
  document.querySelector("#status-donut-total").textContent = total;
  document.querySelector("#status-chart-legend").innerHTML = statuses.map((item) => `<div class="rounded-lg bg-slate-50 p-3"><span class="flex items-center gap-2 text-[10px] text-slate-500"><i class="h-2.5 w-2.5 rounded-full" style="background:${item.color}"></i>${item.label}</span><strong class="mt-1 block text-lg text-navy">${item.count}</strong></div>`).join("");

  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const value = adminLocalDate(date);
    days.push({ date: value, label: new Intl.DateTimeFormat("es-PE", { weekday: "short" }).format(date).replace(".", ""), count: appointments.filter((item) => item.date === value && item.status !== "CANCELADA").length });
  }
  const maximum = Math.max(1, ...days.map((item) => item.count));
  document.querySelector("#weekly-appointments-chart").innerHTML = days.map((item) => `<div class="flex h-full flex-1 flex-col items-center justify-end gap-2"><span class="text-[9px] font-bold text-navy">${item.count}</span><div class="w-full max-w-12 rounded-t bg-navy transition-all" style="height:${item.count ? Math.max(12, Math.round((item.count / maximum) * 145)) : 4}px"></div><span class="text-[9px] capitalize text-slate-400">${item.label}</span></div>`).join("");
}

"""
    new_content = content[:idx1] + replacement + content[idx2:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully replaced!")
else:
    print(f"Could not find targets: idx1={idx1}, idx2={idx2}")
