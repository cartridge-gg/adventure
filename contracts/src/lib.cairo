pub mod systems {
    pub mod actions;
}

pub mod models;

pub mod token {
    pub mod map;
    pub mod svg;
    pub mod geo;
    pub mod art;
}

pub mod denshokan {
    pub mod interface;
    pub mod mock;
}

#[cfg(test)]
mod tests {
    mod actions;
    mod svg;
    mod geo;
}
