import { Schema } from 'mongoose';

/**
 * Builds a Mongoose filter object from the filter query string.
 * @param {any} filterQuery - The raw filter query string (parsed from req.query).
 * @returns {object} - The Mongoose-compatible filter object.
 */
export function buildFilterObject(filterQuery: any): object {
    let filterObject = {};

    if (filterQuery) {
        try {
            const parsedFilter = JSON.parse(filterQuery);
            filterObject = parsedFilter;
        } catch (error) {
            throw new Error('Invalid filter query format');
        }
    }

    return filterObject;
}

/**
 * Validates and sanitizes the filter query by ensuring the field names exist in the model schema.
 * @param {object} filter - The raw filter object provided by the user.
 * @param {Schema} schema - The Mongoose schema to validate against.
 * @returns {object} - A sanitized filter object with only valid fields.
 */
export function validateFilterFields(filter: any, schema: Schema): object {
    const sanitizedFilter: any = {};
    const filterObject: { [key: string]: any } = stringToObject(filter);

    for (const key in filterObject) {
        if (schema.obj.hasOwnProperty(key)  || key === 'createdAt' || key === 'updatedAt') {
            const field = schema.obj[key];
            if ((field && typeof field === 'object' && 'q' in field) || key === 'createdAt' || key === 'updatedAt') {
                sanitizedFilter[key] = filterObject[key];
            } else {
                console.warn(`Field '${key}' is not queryable.`);
            }
        }
    }

    return sanitizedFilter;
}

/**
 * Converts a string in the format "{key=value}" into an object.
 * Supports nested operators like `$lte` and parses dates into `Date` objects.
 * @param {string} str - The input string.
 * @returns {object} - The parsed object.
 */
function stringToObject(str: string): object {
    if (!str || str === "{}") {
        return {};
    }

    if (typeof str === "object") {
        return str;
    }

    str = str.trim().replace(/^\{/, "").replace(/\}$/, "");

    const pairs = str.split(",");
    const result: any = {};

    for (const pair of pairs) {
        const [key, value] = pair.split("=").map((item) => item.trim());

        if (key && value) {
            if (value.includes(":")) {
                const [operator, operatorValue] = value.split(":").map((item) => item.trim());
                if (Date.parse(operatorValue)) {
                    result[key] = {
                        [operator]: 
                           new Date(operatorValue)
                        
                    };
                } else {
                    result[key] = {
                        [operator]: operatorValue
                    };
                }
            } else {
                result[key] = isNaN(Number(value)) ? value : Number(value);
            }
        }
    }

    return result;
}