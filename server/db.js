function configuration() {
    const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY on the server');
    }
    return { url, key };
}

function quoteFilter(value) {
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function formatFilter(filter) {
    const { op = 'eq', value } = filter && typeof filter === 'object' && !Array.isArray(filter)
        ? filter
        : { value: filter };
    if (op === 'in') return `in.(${value.map(quoteFilter).join(',')})`;
    if (op === 'is') return `is.${value}`;
    return `${op}.${quoteFilter(value)}`;
}

async function request(method, table, { columns, filters = {}, order, limit, offset, body, count = false } = {}) {
    const { url, key } = configuration();
    const endpoint = new URL(`${url}/rest/v1/${table}`);
    if (columns) endpoint.searchParams.set('select', columns);
    for (const [column, filter] of Object.entries(filters)) endpoint.searchParams.set(column, formatFilter(filter));
    if (order) endpoint.searchParams.set('order', order);
    if (limit !== undefined) endpoint.searchParams.set('limit', String(limit));
    if (offset !== undefined) endpoint.searchParams.set('offset', String(offset));

    const headers = {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json'
    };
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        headers.Prefer = 'return=representation';
    }
    if (count) headers.Prefer = [headers.Prefer, 'count=exact'].filter(Boolean).join(',');

    const response = await fetch(endpoint, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store'
    });
    const text = await response.text();
    let payload = null;
    if (text) {
        try { payload = JSON.parse(text); } catch { payload = text; }
    }
    if (!response.ok) {
        const message = payload?.message || payload?.details || payload?.hint || `HTTP ${response.status}`;
        throw new Error(`Supabase request failed: ${message}`);
    }
    const range = response.headers.get('content-range');
    const total = range && range.includes('/') ? Number(range.split('/').at(-1)) : null;
    return { data: Array.isArray(payload) ? payload : [], total: Number.isFinite(total) ? total : null };
}

export async function selectRows(table, options = {}) {
    return (await request('GET', table, options)).data;
}

export async function selectRowsWithCount(table, options = {}) {
    return request('GET', table, { ...options, count: true });
}

export async function countRows(table, filters = {}) {
    const result = await selectRowsWithCount(table, { columns: '*', filters, limit: 1 });
    return result.total ?? result.data.length;
}

export async function insertRow(table, row) {
    const result = await request('POST', table, { body: row });
    return result.data[0] || null;
}

export async function updateRows(table, updates, filters) {
    return (await request('PATCH', table, { body: updates, filters })).data;
}

export async function deleteRows(table, filters) {
    return (await request('DELETE', table, { filters })).data;
}
