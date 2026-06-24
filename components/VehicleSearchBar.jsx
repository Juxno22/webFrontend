"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import {
    getVehiculoAnios,
    getVehiculoLineas,
    getVehiculoMarcas,
    getVehiculoModelos,
    getVehiculoMotores,
} from "../app/lib/api";

export default function VehicleSearchBar({ variant = "full" }) {
    const router = useRouter();

    const [form, setForm] = useState({
        anio: "",
        marca: "",
        modelo: "",
        motor: "",
        linea: "",
        q: "",
    });

    const [options, setOptions] = useState({
        anios: [],
        marcas: [],
        modelos: [],
        motores: [],
        lineas: [],
    });

    const [loading, setLoading] = useState({
        anios: false,
        marcas: false,
        modelos: false,
        motores: false,
        lineas: false,
    });
    const [fetchError, setFetchError] = useState("");

    useEffect(() => {
        async function loadAnios() {
            try {
                setLoading((current) => ({ ...current, anios: true }));

                const response = await getVehiculoAnios();

                setOptions((current) => ({
                    ...current,
                    anios: response.data || [],
                }));
                setFetchError("");
            } catch {
                setFetchError("No se pudieron cargar las opciones. Intenta de nuevo.");
                setOptions((current) => ({
                    ...current,
                    anios: [],
                }));
            } finally {
                setLoading((current) => ({ ...current, anios: false }));
            }
        }

        loadAnios();
    }, []);

    async function handleChange(name, value) {
        if (name === "anio") {
            setForm({
                anio: value,
                marca: "",
                modelo: "",
                motor: "",
                linea: "",
                q: form.q,
            });

            setOptions((current) => ({
                ...current,
                marcas: [],
                modelos: [],
                motores: [],
                lineas: [],
            }));

            if (!value) return;

            try {
                setLoading((current) => ({ ...current, marcas: true }));
                const response = await getVehiculoMarcas(value);

                setOptions((current) => ({
                    ...current,
                    marcas: response.data || [],
                }));
                setFetchError("");
            } catch {
                setFetchError("No se pudieron cargar las opciones. Intenta de nuevo.");
                setOptions((current) => ({ ...current, marcas: [] }));
            } finally {
                setLoading((current) => ({ ...current, marcas: false }));
            }

            return;
        }

        if (name === "marca") {
            setForm((current) => ({
                ...current,
                marca: value,
                modelo: "",
                motor: "",
                linea: "",
            }));

            setOptions((current) => ({
                ...current,
                modelos: [],
                motores: [],
                lineas: [],
            }));

            if (!value) return;

            try {
                setLoading((current) => ({ ...current, modelos: true }));
                const response = await getVehiculoModelos(form.anio, value);

                setOptions((current) => ({
                    ...current,
                    modelos: response.data || [],
                }));
                setFetchError("");
            } catch {
                setFetchError("No se pudieron cargar las opciones. Intenta de nuevo.");
                setOptions((current) => ({ ...current, modelos: [] }));
            } finally {
                setLoading((current) => ({ ...current, modelos: false }));
            }

            return;
        }

        if (name === "modelo") {
            setForm((current) => ({
                ...current,
                modelo: value,
                motor: "",
                linea: "",
            }));

            setOptions((current) => ({
                ...current,
                motores: [],
                lineas: [],
            }));

            if (!value) return;

            try {
                setLoading((current) => ({ ...current, motores: true }));
                const response = await getVehiculoMotores(
                    form.anio,
                    form.marca,
                    value
                );

                setOptions((current) => ({
                    ...current,
                    motores: response.data || [],
                }));
                setFetchError("");
            } catch {
                setFetchError("No se pudieron cargar las opciones. Intenta de nuevo.");
                setOptions((current) => ({ ...current, motores: [] }));
            } finally {
                setLoading((current) => ({ ...current, motores: false }));
            }

            return;
        }

        if (name === "motor") {
            setForm((current) => ({
                ...current,
                motor: value,
                linea: "",
            }));

            setOptions((current) => ({
                ...current,
                lineas: [],
            }));

            if (!value) return;

            try {
                setLoading((current) => ({ ...current, lineas: true }));
                const response = await getVehiculoLineas(
                    form.anio,
                    form.marca,
                    form.modelo,
                    value
                );

                setOptions((current) => ({
                    ...current,
                    lineas: response.data || [],
                }));
                setFetchError("");
            } catch {
                setFetchError("No se pudieron cargar las opciones. Intenta de nuevo.");
                setOptions((current) => ({ ...current, lineas: [] }));
            } finally {
                setLoading((current) => ({ ...current, lineas: false }));
            }

            return;
        }

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        const params = new URLSearchParams();

        if (form.q.trim()) params.set("q", form.q.trim());
        if (form.anio) params.set("anio", form.anio);
        if (form.marca) params.set("marca_auto", form.marca);
        if (form.modelo) params.set("modelo_auto", form.modelo);
        if (form.motor) params.set("motor", form.motor);
        if (form.linea) params.set("linea", form.linea);

        const query = params.toString();

        router.push(query ? `/catalogo?${query}` : "/catalogo");
    }

    return (
        <form
            className={`vehicle-finder ${variant === "compact" ? "vehicle-finder-compact" : ""
                } ${variant === "sidebar" ? "vehicle-finder-sidebar" : ""}`}
            onSubmit={handleSubmit}
        >
            <div className="vehicle-finder-heading">
                <div>
                    <span>
                        <Sparkles size={15} />
                        Buscador guiado
                    </span>

                    <h2>Encuentra la refacción por vehículo</h2>
                </div>

                <p>
                    Cada campo se activa cuando eliges el anterior.
                </p>
            </div>

            <div className="vehicle-finder-grid">
                <label>
                    <span>Año</span>
                    <select
                        value={form.anio}
                        onChange={(event) => handleChange("anio", event.target.value)}
                    >
                        <option value="">
                            {loading.anios ? "Cargando..." : "Seleccionar"}
                        </option>

                        {options.anios.map((item) => (
                            <option key={item.anio} value={item.anio}>
                                {item.anio}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={!form.anio ? "is-disabled" : ""}>
                    <span>Marca</span>
                    <select
                        value={form.marca}
                        onChange={(event) => handleChange("marca", event.target.value)}
                        disabled={!form.anio || loading.marcas}
                    >
                        <option value="">
                            {!form.anio
                                ? "Bloqueado"
                                : loading.marcas
                                    ? "Cargando..."
                                    : "Seleccionar"}
                        </option>

                        {options.marcas.map((item) => (
                            <option key={item.marca} value={item.marca}>
                                {item.marca}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={!form.marca ? "is-disabled" : ""}>
                    <span>Modelo</span>
                    <select
                        value={form.modelo}
                        onChange={(event) => handleChange("modelo", event.target.value)}
                        disabled={!form.marca || loading.modelos}
                    >
                        <option value="">
                            {!form.marca
                                ? "Bloqueado"
                                : loading.modelos
                                    ? "Cargando..."
                                    : "Seleccionar"}
                        </option>

                        {options.modelos.map((item) => (
                            <option key={item.modelo} value={item.modelo}>
                                {item.modelo}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={!form.modelo ? "is-disabled" : ""}>
                    <span>Motor</span>
                    <select
                        value={form.motor}
                        onChange={(event) => handleChange("motor", event.target.value)}
                        disabled={!form.modelo || loading.motores}
                    >
                        <option value="">
                            {!form.modelo
                                ? "Bloqueado"
                                : loading.motores
                                    ? "Cargando..."
                                    : "Seleccionar"}
                        </option>

                        {options.motores.map((item) => (
                            <option key={item.motor} value={item.motor}>
                                {item.motor}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={!form.motor ? "is-disabled" : ""}>
                    <span>Línea</span>
                    <select
                        value={form.linea}
                        onChange={(event) => handleChange("linea", event.target.value)}
                        disabled={!form.motor || loading.lineas}
                    >
                        <option value="">
                            {!form.motor
                                ? "Bloqueado"
                                : loading.lineas
                                    ? "Cargando..."
                                    : "Todas"}
                        </option>

                        {options.lineas.map((item) => (
                            <option key={item.linea} value={item.linea}>
                                {item.linea} ({item.total_productos})
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {fetchError && (
                <p className="vehicle-finder-error" role="alert">
                    {fetchError}
                </p>
            )}

            <div className="vehicle-finder-bottom">
                <div className="vehicle-free-field">
                    <Search size={20} />
                    <input
                        type="search"
                        value={form.q}
                        onChange={(event) => handleChange("q", event.target.value)}
                        placeholder="También puedes buscar por código, cruce o descripción..."
                    />
                </div>

                <button type="submit" className="vehicle-finder-button">
                    Buscar
                </button>
            </div>
        </form>
    );
}