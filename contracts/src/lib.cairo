pub mod systems {
    pub mod actions;
}

pub mod models;

pub mod token {
    pub mod map;
    pub mod svg;
}

pub mod denshokan {
    pub mod interface;
}

#[cfg(test)]
mod tests {
    mod actions;
    mod mocks;
    mod svg;
}
